import { Result, isFailure } from "@codestate/core/domain/models/Result";
import {
  Script,
  ScriptCollection,
  ScriptIndex,
} from "@codestate/core/domain/models/Script";
import { IConfigService } from "@codestate/core/domain/ports/IConfigService";
import { IEncryptionService } from "@codestate/core/domain/ports/IEncryptionService";
import { ILoggerService } from "@codestate/core/domain/ports/ILoggerService";
import { IScriptRepository } from "@codestate/core/domain/ports/IScriptService";
import {
  validateScript,
  validateScriptCollection,
  validateScriptIndex,
} from "@codestate/core/domain/schemas/SchemaRegistry";
import {
  ErrorCode,
  ScriptError,
} from "@codestate/core/domain/types/ErrorTypes";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

const DEFAULT_SCRIPTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".codestate",
  "scripts"
);
const INDEX_FILE = "index.json";
const TEMP_SUFFIX = ".tmp";
const BACKUP_SUFFIX = ".bak";

export class ScriptRepository implements IScriptRepository {
  constructor(
    private logger: ILoggerService,
    private encryption: IEncryptionService,
    private configService: IConfigService,
    private scriptsDir: string = DEFAULT_SCRIPTS_DIR
  ) {}

  async createScript(script: Script): Promise<Result<void>> {
    try {
      await this.ensureScriptsDir();

      // Validate script
      const validatedScript = validateScript(script);

      // Check if rootPath exists
      if (!(await this.pathExists(validatedScript.rootPath))) {
        this.logger.error("Root path does not exist", {
          rootPath: validatedScript.rootPath,
        });
        return {
          ok: false,
          error: new ScriptError(
            "Root path does not exist",
            ErrorCode.SCRIPT_PATH_INVALID,
            { rootPath: validatedScript.rootPath }
          ),
        };
      }

      // Check for duplicate script command (handle both legacy and new format)
      const existingScripts = await this.getScriptsByRootPath(
        validatedScript.rootPath
      );
      if (existingScripts.ok && validatedScript.script) {
        const duplicate = existingScripts.value.find(
          (s) => s.script === validatedScript.script
        );
        if (duplicate) {
          this.logger.error("Duplicate script command found", {
            script: validatedScript.script,
            rootPath: validatedScript.rootPath,
          });
          return {
            ok: false,
            error: new ScriptError(
              "Script command already exists",
              ErrorCode.SCRIPT_DUPLICATE,
              {
                script: validatedScript.script,
                rootPath: validatedScript.rootPath,
              }
            ),
          };
        }
      }

      // Create individual script file using UUID-based naming
      const scriptFileName = `${validatedScript.id}.json`;
      const scriptFilePath = path.join(this.scriptsDir, scriptFileName);
      
      // Save individual script
      let data = JSON.stringify(validatedScript, null, 2);
      let encrypted = false;

      // Check if encryption is enabled
      const config = await this.configService.getConfig();
      if (
        config.ok &&
        config.value.encryption?.enabled &&
        config.value.encryption.encryptionKey
      ) {
        const encResult = await this.encryption.encrypt(
          data,
          config.value.encryption.encryptionKey
        );
        if (isFailure(encResult)) {
          this.logger.error("Failed to encrypt script", { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }

      // Write script file with backup
      const tempPath = `${scriptFilePath}${TEMP_SUFFIX}`;
      await fs.writeFile(tempPath, data, { encoding: "utf8" });
      
      // Create backup if file exists
      try {
        await fs.access(scriptFilePath);
        await fs.copyFile(scriptFilePath, `${scriptFilePath}${BACKUP_SUFFIX}`);
      } catch {
        // File doesn't exist, no backup needed
      }
      
      // Atomic move
      await fs.rename(tempPath, scriptFilePath);

      // Update index to include this script
      await this.updateIndexForScript(validatedScript);

      this.logger.log("Script created successfully", {
        name: validatedScript.name,
        id: validatedScript.id,
        rootPath: validatedScript.rootPath,
      });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to create script", {
        error: err.message,
        script,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async createScripts(scripts: Script[]): Promise<Result<void>> {
    try {
      if (scripts.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug("Creating multiple scripts", { count: scripts.length });

      // Create each script individually using the new UUID-based approach
      for (const script of scripts) {
        const createResult = await this.createScript(script);
        if (isFailure(createResult)) {
          this.logger.error("Failed to create script", { script, error: createResult.error });
          return createResult;
        }
      }

      this.logger.log("Multiple scripts created successfully", {
        count: scripts.length,
      });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to create multiple scripts", {
        error: err.message,
        count: scripts.length,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>> {
    try {
      const allScripts = await this.getAllScripts();
      if (isFailure(allScripts)) {
        return { ok: true, value: [] };
      }
      
      // Filter scripts by rootPath
      const scriptsForPath = allScripts.value.filter(s => s.rootPath === rootPath);
      return { ok: true, value: scriptsForPath };
    } catch (err: any) {
      this.logger.error("Failed to get scripts by root path", {
        error: err.message,
        rootPath,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async getAllScripts(): Promise<Result<Script[]>> {
    try {
      const index = await this.loadScriptIndex();
      if (isFailure(index)) {
        return { ok: true, value: [] };
      }

      const allScripts: Script[] = [];
      for (const entry of index.value.entries) {
        try {
          const scriptFilePath = path.join(this.scriptsDir, entry.referenceFile);
          const raw = await fs.readFile(scriptFilePath, { encoding: "utf8" });
          let data = raw;

          // Check if encrypted
          if (raw.startsWith("ENCRYPTED_v1")) {
            const config = await this.configService.getConfig();
            if (
              config.ok &&
              config.value.encryption?.enabled &&
              config.value.encryption.encryptionKey
            ) {
              const decrypted = await this.encryption.decrypt(
                raw,
                config.value.encryption.encryptionKey
              );
              if (isFailure(decrypted)) {
                this.logger.error("Failed to decrypt script", { error: decrypted.error });
                continue; // Skip this script if decryption fails
              }
              data = decrypted.value;
            }
          }

          const parsed = JSON.parse(data);
          const script = validateScript(parsed);
          allScripts.push(script);
        } catch (error) {
          this.logger.error("Failed to load script file", { 
            referenceFile: entry.referenceFile, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          // Continue loading other scripts even if one fails
          continue;
        }
      }

      return { ok: true, value: allScripts };
    } catch (err: any) {
      this.logger.error("Failed to get all scripts", { error: err.message });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async getScriptById(id: string): Promise<Result<Script>> {
    try {
      const allScripts = await this.getAllScripts();
      if (isFailure(allScripts)) {
        return { ok: false, error: allScripts.error };
      }

      const script = allScripts.value.find(s => s.id === id);
      if (!script) {
        return {
          ok: false,
          error: new ScriptError(
            `Script with ID '${id}' not found`,
            ErrorCode.SCRIPT_INVALID,
            { scriptId: id }
          ),
        };
      }

      return { ok: true, value: script };
    } catch (err: any) {
      this.logger.error("Failed to get script by ID", {
        error: err.message,
        scriptId: id,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async updateScript(
    name: string,
    rootPath: string,
    scriptUpdate: Partial<Script>
  ): Promise<Result<void>> {
    try {
      const scripts = await this.getScriptsByRootPath(rootPath);
      if (isFailure(scripts)) {
        return { ok: false, error: scripts.error };
      }

      const scriptIndex = scripts.value.findIndex((s) => s.name === name);
      if (scriptIndex === -1) {
        this.logger.error("Script not found", { name, rootPath });
        return {
          ok: false,
          error: new ScriptError(
            "Script not found",
            ErrorCode.SCRIPT_NOT_FOUND,
            { name, rootPath }
          ),
        };
      }

      // Update script
      const updatedScript = { ...scripts.value[scriptIndex], ...scriptUpdate };
      const validatedScript = validateScript(updatedScript);

      // Check for duplicate script command (excluding the current script, handle both formats)
      if (validatedScript.script) {
        const duplicate = scripts.value.find(
          (s) => s.script === validatedScript.script && s.name !== name
        );
        if (duplicate) {
          this.logger.error("Duplicate script command found", {
            script: validatedScript.script,
            rootPath,
          });
          return {
            ok: false,
            error: new ScriptError(
              "Script command already exists",
              ErrorCode.SCRIPT_DUPLICATE,
              { script: validatedScript.script, rootPath }
            ),
          };
        }
      }

      // Update in collection
      scripts.value[scriptIndex] = validatedScript;
      const collection: ScriptCollection = { scripts: scripts.value };

      // Save collection
      const saveResult = await this.saveScriptCollection(rootPath, collection);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }

      this.logger.log("Script updated successfully", { name, rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to update script", {
        error: err.message,
        name,
        rootPath,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async updateScripts(
    updates: Array<{ name: string; rootPath: string; script: Partial<Script> }>
  ): Promise<Result<void>> {
    try {
      if (updates.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug("Updating multiple scripts", { count: updates.length });

      // Group updates by rootPath for efficient processing
      const updatesByRootPath = new Map<
        string,
        Array<{ name: string; script: Partial<Script> }>
      >();
      for (const update of updates) {
        if (!updatesByRootPath.has(update.rootPath)) {
          updatesByRootPath.set(update.rootPath, []);
        }
        updatesByRootPath
          .get(update.rootPath)!
          .push({ name: update.name, script: update.script });
      }

      // Process each rootPath group
      for (const [rootPath, rootUpdates] of updatesByRootPath) {
        const scripts = await this.getScriptsByRootPath(rootPath);
        if (isFailure(scripts)) {
          return { ok: false, error: scripts.error };
        }

        const updatedScripts = [...scripts.value];
        const updatedNames = new Set<string>();

        // Apply updates
        for (const update of rootUpdates) {
          const scriptIndex = updatedScripts.findIndex(
            (s) => s.name === update.name
          );
          if (scriptIndex === -1) {
            this.logger.error("Script not found for update", {
              name: update.name,
              rootPath,
            });
            return {
              ok: false,
              error: new ScriptError(
                "Script not found",
                ErrorCode.SCRIPT_NOT_FOUND,
                { name: update.name, rootPath }
              ),
            };
          }

          // Update script
          const updatedScript = {
            ...updatedScripts[scriptIndex],
            ...update.script,
          };
          const validatedScript = validateScript(updatedScript);
          updatedScripts[scriptIndex] = validatedScript;
          updatedNames.add(update.name);
        }

        // Check for duplicates (excluding updated scripts, handle both formats)
        const scriptCommands = new Set<string>();
        const duplicates: string[] = [];

        for (const script of updatedScripts) {
          if (script.script) {
            if (scriptCommands.has(script.script)) {
              if (!updatedNames.has(script.name)) {
                duplicates.push(script.script);
              }
            } else {
              scriptCommands.add(script.script);
            }
          }
        }

        if (duplicates.length > 0) {
          this.logger.error("Duplicate script commands found after updates", {
            duplicates,
            rootPath,
          });
          return {
            ok: false,
            error: new ScriptError(
              "Duplicate script commands found",
              ErrorCode.SCRIPT_DUPLICATE,
              { duplicates, rootPath }
            ),
          };
        }

        // Save updated collection
        const collection: ScriptCollection = { scripts: updatedScripts };
        const saveResult = await this.saveScriptCollection(
          rootPath,
          collection
        );
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
      }

      this.logger.log("Multiple scripts updated successfully", {
        count: updates.length,
      });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to update multiple scripts", {
        error: err.message,
        count: updates.length,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async deleteScript(scriptId: string): Promise<Result<void>> {
    try {
      // Get script by ID first to verify it exists
      const script = await this.getScriptById(scriptId);
      if (isFailure(script)) {
        return { ok: false, error: script.error };
      }

      // Delete the individual script file
      const scriptFileName = `${scriptId}.json`;
      const scriptFilePath = path.join(this.scriptsDir, scriptFileName);
      
      try {
        await fs.unlink(scriptFilePath);
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          this.logger.error("Failed to delete script file", { error, scriptFilePath });
          return {
            ok: false,
            error: new ScriptError(
              "Failed to delete script file",
              ErrorCode.SCRIPT_INVALID,
              { originalError: error instanceof Error ? error.message : 'Unknown error' }
            ),
          };
        }
        // File doesn't exist, which is fine for deletion
      }

      // Remove from index
      await this.removeScriptFromIndex(scriptId);

      this.logger.log("Script deleted successfully", { scriptId });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to delete script", {
        error: err.message,
        scriptId,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async deleteScripts(scriptIds: string[]): Promise<Result<void>> {
    try {
      if (scriptIds.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug("Deleting multiple scripts", { count: scriptIds.length });

      for (const scriptId of scriptIds) {
        const deleteResult = await this.deleteScript(scriptId);
        if (isFailure(deleteResult)) {
          this.logger.error("Failed to delete script", { scriptId, error: deleteResult.error });
          return deleteResult;
        }
      }

      this.logger.log("Multiple scripts deleted successfully", {
        count: scriptIds.length,
      });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to delete multiple scripts", {
        error: err.message,
        count: scriptIds.length,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async deleteScriptsByRootPath(rootPath: string): Promise<Result<void>> {
    try {
      const referenceFile = await this.getReferenceFilePath(rootPath);
      if (referenceFile) {
        await fs.unlink(referenceFile).catch(() => {}); // Ignore if file doesn't exist
      }

      // Remove from index
      await this.removeFromIndex(rootPath);

      this.logger.log("Scripts deleted for root path", { rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to delete scripts by root path", {
        error: err.message,
        rootPath,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async loadScriptIndex(): Promise<Result<ScriptIndex>> {
    try {
      await this.ensureScriptsDir();
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);

      try {
        const raw = await fs.readFile(indexPath, { encoding: "utf8" });
        let data = raw;

        // Check if encrypted
        if (raw.startsWith("ENCRYPTED_v1")) {
          const config = await this.configService.getConfig();
          if (
            config.ok &&
            config.value.encryption?.enabled &&
            config.value.encryption.encryptionKey
          ) {
            const decrypted = await this.encryption.decrypt(
              raw,
              config.value.encryption.encryptionKey
            );
            if (isFailure(decrypted)) {
              this.logger.error("Failed to decrypt script index", {
                error: decrypted.error,
              });
              return { ok: false, error: decrypted.error };
            }
            data = decrypted.value;
          }
        }

        const parsed = JSON.parse(data);
        const index = validateScriptIndex(parsed);
        this.logger.debug("Script index loaded", { indexPath });
        return { ok: true, value: index };
      } catch (err: any) {
        if (err.code === "ENOENT") {
          // Create default index
          const defaultIndex: ScriptIndex = { entries: [] };
          await this.saveScriptIndex(defaultIndex);
          return { ok: true, value: defaultIndex };
        }
        throw err;
      }
    } catch (err: any) {
      this.logger.error("Failed to load script index", { error: err.message });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async saveScriptIndex(index: ScriptIndex): Promise<Result<void>> {
    try {
      await this.ensureScriptsDir();
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);

      const validated = validateScriptIndex(index);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;

      // Check if encryption is enabled
      const config = await this.configService.getConfig();
      if (
        config.ok &&
        config.value.encryption?.enabled &&
        config.value.encryption.encryptionKey
      ) {
        const encResult = await this.encryption.encrypt(
          data,
          config.value.encryption.encryptionKey
        );
        if (isFailure(encResult)) {
          this.logger.error("Failed to encrypt script index", {
            error: encResult.error,
          });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }

      // Atomic write
      const tempPath = indexPath + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: "utf8", mode: 0o600 });
      await fs.rename(indexPath, indexPath + BACKUP_SUFFIX).catch(() => {});
      await fs.rename(tempPath, indexPath);

      this.logger.log("Script index saved", { indexPath, encrypted });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to save script index", { error: err.message });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  // Private helper methods
  private async ensureScriptsDir() {
    await fs.mkdir(this.scriptsDir, { recursive: true, mode: 0o700 });
  }

  private async pathExists(pathToCheck: string): Promise<boolean> {
    try {
      await fs.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }

  private async saveScriptCollection(
    rootPath: string,
    collection: ScriptCollection
  ): Promise<Result<void>> {
    try {
      const validated = validateScriptCollection(collection);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;

      // Check if encryption is enabled
      const config = await this.configService.getConfig();
      if (
        config.ok &&
        config.value.encryption?.enabled &&
        config.value.encryption.encryptionKey
      ) {
        const encResult = await this.encryption.encrypt(
          data,
          config.value.encryption.encryptionKey
        );
        if (isFailure(encResult)) {
          this.logger.error("Failed to encrypt script collection", {
            error: encResult.error,
          });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }

      const referenceFile = await this.getReferenceFilePath(rootPath);
      if (!referenceFile) {
        return {
          ok: false,
          error: new ScriptError(
            "Reference file not found",
            ErrorCode.SCRIPT_NOT_FOUND,
            { rootPath }
          ),
        };
      }

      const tempPath = referenceFile + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: "utf8", mode: 0o600 });
      await fs
        .rename(referenceFile, referenceFile + BACKUP_SUFFIX)
        .catch(() => {});
      await fs.rename(tempPath, referenceFile);

      this.logger.debug("Script collection saved", {
        referenceFile,
        encrypted,
      });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to save script collection", {
        error: err.message,
        rootPath,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  private async getReferenceFilePath(rootPath: string): Promise<string | null> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return null;
    }

    const entry = index.value.entries.find((e) => e.rootPath === rootPath);
    return entry ? path.join(this.scriptsDir, entry.referenceFile) : null;
  }

  private async getOrCreateReferenceFilePath(
    rootPath: string
  ): Promise<string> {
    const existingPath = await this.getReferenceFilePath(rootPath);
    if (existingPath) {
      return existingPath;
    }

    // Create new reference file path using a unique UUID for the collection file
    // Each script collection gets its own UUID, independent of rootPath
    const fileName = `${randomUUID()}.json`;
    return path.join(this.scriptsDir, fileName);
  }

  private async updateIndexForRootPath(rootPath: string): Promise<void> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }

    const referenceFile = await this.getOrCreateReferenceFilePath(rootPath);
    const relativePath = path.relative(this.scriptsDir, referenceFile);

    // Check if entry already exists
    const existingIndex = index.value.entries.findIndex(
      (e) => e.rootPath === rootPath
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      index.value.entries[existingIndex].referenceFile = relativePath;
    } else {
      // Add new entry with UUID that matches the filename
      const fileName = path.basename(referenceFile, '.json');
      index.value.entries.push({
        id: fileName, // Use the UUID from filename as the ID
        rootPath,
        referenceFile: relativePath
      });
    }

    await this.saveScriptIndex(index.value);
  }

  private async updateIndexForScript(script: Script): Promise<void> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }

    const scriptFileName = `${script.id}.json`;
    const scriptFilePath = path.join(this.scriptsDir, scriptFileName);
    const relativePath = path.relative(this.scriptsDir, scriptFilePath);

    // Check if entry already exists
    const existingIndex = index.value.entries.findIndex(
      (e) => e.referenceFile === relativePath
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      index.value.entries[existingIndex].rootPath = script.rootPath;
    } else {
      // Add new entry
      index.value.entries.push({
        id: script.id,
        rootPath: script.rootPath,
        referenceFile: relativePath
      });
    }

    await this.saveScriptIndex(index.value);
  }

  private async removeFromIndex(rootPath: string): Promise<void> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }

    index.value.entries = index.value.entries.filter(
      (e) => e.rootPath !== rootPath
    );
    await this.saveScriptIndex(index.value);
  }

  private async removeScriptFromIndex(scriptId: string): Promise<void> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }

    index.value.entries = index.value.entries.filter(
      (e) => e.id !== scriptId
    );
    await this.saveScriptIndex(index.value);
  }
}
