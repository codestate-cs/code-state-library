import { Result, isFailure } from "@codestate/core/domain/models/Result";
import {
  Script,
  ScriptIndex,
  LifecycleEvent,
} from "@codestate/core/domain/models/Script";
import { IConfigService } from "@codestate/core/domain/ports/IConfigService";
import { IEncryptionService } from "@codestate/core/domain/ports/IEncryptionService";
import { ILoggerService } from "@codestate/core/domain/ports/ILoggerService";
import { IScriptRepository } from "@codestate/core/domain/ports/IScriptService";
import {
  validateScript,
  validateScriptIndex,
} from "@codestate/core/domain/schemas/SchemaRegistry";
import {
  ErrorCode,
  ScriptError,
} from "@codestate/core/domain/types/ErrorTypes";
import * as fs from "fs/promises";
import * as path from "path";

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

  private async ensureScriptsDir(): Promise<void> {
    try {
      await fs.access(this.scriptsDir);
    } catch {
      await fs.mkdir(this.scriptsDir, { recursive: true });
    }
  }

  private async pathExists(pathToCheck: string): Promise<boolean> {
    try {
      await fs.access(pathToCheck);
      return true;
    } catch {
      return false;
    }
  }

  private async getIndex(): Promise<Result<ScriptIndex>> {
    try {
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);
      const data = await fs.readFile(indexPath, { encoding: "utf8" });
      const index = JSON.parse(data);
      const validatedIndex = validateScriptIndex(index);
      return { ok: true, value: validatedIndex };
    } catch (err: any) {
      if (err.code === "ENOENT") {
        // Index doesn't exist, create empty one
        const emptyIndex: ScriptIndex = { entries: [] };
        return { ok: true, value: emptyIndex };
      }
      this.logger.error("Failed to load script index", { error: err.message });
      return {
        ok: false,
        error: new ScriptError(
          "Failed to load script index",
          ErrorCode.SCRIPT_INVALID,
          { originalError: err.message }
        ),
      };
    }
  }

  private async updateIndexForScript(script: Script): Promise<void> {
    try {
      const indexResult = await this.getIndex();
      if (isFailure(indexResult)) {
        this.logger.error("Failed to get index for update", { error: indexResult.error });
        return;
      }

      const index = indexResult.value;
      
      // Remove existing entry if it exists
      index.entries = index.entries.filter(e => e.id !== script.id);
      
      // Add new entry
      index.entries.push({
        id: script.id,
        rootPath: script.rootPath,
        referenceFile: `${script.id}.json`
      });

      // Save updated index
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);
      const tempPath = `${indexPath}${TEMP_SUFFIX}`;
      await fs.writeFile(tempPath, JSON.stringify(index, null, 2), { encoding: "utf8" });
      
      // Create backup if file exists
      try {
        await fs.access(indexPath);
        await fs.copyFile(indexPath, `${indexPath}${BACKUP_SUFFIX}`);
      } catch {
        // File doesn't exist, no backup needed
      }
      
      // Atomic move
      await fs.rename(tempPath, indexPath);
    } catch (err: any) {
      this.logger.error("Failed to update script index", { error: err.message });
    }
  }

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

  async getScriptById(id: string): Promise<Result<Script>> {
    try {
      const indexResult = await this.getIndex();
      if (isFailure(indexResult)) {
        return indexResult;
      }

      const entry = indexResult.value.entries.find(e => e.id === id);
      if (!entry) {
        this.logger.error("Script not found by ID", { id });
        return {
          ok: false,
          error: new ScriptError(
            "Script not found",
            ErrorCode.SCRIPT_NOT_FOUND,
            { id }
          ),
        };
      }

      const scriptFilePath = path.join(this.scriptsDir, entry.referenceFile);
      const data = await fs.readFile(scriptFilePath, { encoding: "utf8" });
      
      // Check if data is encrypted
      let decryptedData = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.encrypted) {
          const config = await this.configService.getConfig();
          if (
            config.ok &&
            config.value.encryption?.enabled &&
            config.value.encryption.encryptionKey
          ) {
            const decResult = await this.encryption.decrypt(
              data,
              config.value.encryption.encryptionKey
            );
            if (isFailure(decResult)) {
              this.logger.error("Failed to decrypt script", { error: decResult.error });
              return { ok: false, error: decResult.error };
            }
            decryptedData = decResult.value;
          }
        }
      } catch {
        // Not JSON, might be encrypted
        const config = await this.configService.getConfig();
        if (
          config.ok &&
          config.value.encryption?.enabled &&
          config.value.encryption.encryptionKey
        ) {
          const decResult = await this.encryption.decrypt(
            data,
            config.value.encryption.encryptionKey
          );
          if (isFailure(decResult)) {
            this.logger.error("Failed to decrypt script", { error: decResult.error });
            return { ok: false, error: decResult.error };
          }
          decryptedData = decResult.value;
        }
      }

      const validatedScript = validateScript(JSON.parse(decryptedData));
      this.logger.log("Script retrieved successfully by ID", { id });
      return { ok: true, value: validatedScript };
    } catch (err: any) {
      this.logger.error("Failed to get script by ID", {
        error: err.message,
        id,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async getScripts(options?: { rootPath?: string; lifecycle?: LifecycleEvent; ids?: string[] }): Promise<Result<Script[]>> {
    try {
      this.logger.debug("ScriptRepository.getScripts called", { options });

      const indexResult = await this.getIndex();
      if (isFailure(indexResult)) {
        return indexResult;
      }

      let filteredEntries = indexResult.value.entries;

      // Apply IDs filter if provided
      if (options?.ids && options.ids.length > 0) {
        filteredEntries = filteredEntries.filter(e => options.ids!.includes(e.id));
      }

      // Apply rootPath filter if provided
      if (options?.rootPath) {
        filteredEntries = filteredEntries.filter(e => e.rootPath === options.rootPath);
      }

      // Apply lifecycle filter if provided
      if (options?.lifecycle) {
        // We need to read the actual script files to check lifecycle
        const scripts: Script[] = [];
        
        for (const entry of filteredEntries) {
          const scriptResult = await this.getScriptById(entry.id);
          if (scriptResult.ok && scriptResult.value.lifecycle?.includes(options.lifecycle! as LifecycleEvent)) {
            scripts.push(scriptResult.value);
          }
        }
        
        this.logger.log("Scripts retrieved with lifecycle filter", { options, count: scripts.length });
        return { ok: true, value: scripts };
      }

      // If no lifecycle filter, just apply rootPath filter and return data
      if (options?.rootPath) {
        const scripts: Script[] = [];
        
        for (const entry of filteredEntries) {
          const scriptResult = await this.getScriptById(entry.id);
          if (scriptResult.ok) {
            scripts.push(scriptResult.value);
          }
        }
        
        this.logger.log("Scripts retrieved by root path", { rootPath: options.rootPath, count: scripts.length });
        return { ok: true, value: scripts };
      }

      // No filters - return all scripts
      const scripts: Script[] = [];
      
      for (const entry of filteredEntries) {
        const scriptResult = await this.getScriptById(entry.id);
        if (scriptResult.ok) {
          scripts.push(scriptResult.value);
        }
      }
      
      this.logger.log("All scripts retrieved", { count: scripts.length });
      return { ok: true, value: scripts };
    } catch (err: any) {
      this.logger.error("Failed to get scripts", {
        error: err.message,
        options,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }

  async updateScript(id: string, script: Partial<Script>): Promise<Result<void>> {
    try {
      this.logger.debug("ScriptRepository.updateScript called", { id, script });

      // Get existing script
      const existingResult = await this.getScriptById(id);
      if (isFailure(existingResult)) {
        return existingResult;
      }

      // Merge updates
      const updatedScript = { ...existingResult.value, ...script };

      // Validate updated script
      const validatedScript = validateScript(updatedScript);

      // Save updated script
      const scriptFileName = `${validatedScript.id}.json`;
      const scriptFilePath = path.join(this.scriptsDir, scriptFileName);
      
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
          this.logger.error("Failed to encrypt updated script", { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }

      // Write updated script file with backup
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

      // Update index
      await this.updateIndexForScript(validatedScript);

      this.logger.log("Script updated successfully", { id });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to update script", {
        error: err.message,
        id,
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

  async deleteScripts(ids: string[]): Promise<Result<void>> {
    try {
      this.logger.debug("ScriptRepository.deleteScripts called", { ids });

      const indexResult = await this.getIndex();
      if (isFailure(indexResult)) {
        return indexResult;
      }

      const entriesToDelete = indexResult.value.entries.filter(e => ids.includes(e.id));

      if (entriesToDelete.length === 0) {
        this.logger.error("No scripts found for deletion", { ids });
        return {
          ok: false,
          error: new ScriptError(
            "No scripts found with the provided IDs",
            ErrorCode.SCRIPT_NOT_FOUND,
            { ids }
          ),
        };
      }

      // Delete each script
      for (const entry of entriesToDelete) {
        const scriptFilePath = path.join(this.scriptsDir, entry.referenceFile);
        
        // Delete main file
        try {
          await fs.unlink(scriptFilePath);
        } catch (err: any) {
          if (err.code !== "ENOENT") {
            this.logger.error("Failed to delete script file", { error: err.message, id: entry.id });
            return {
              ok: false,
              error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
                originalError: err.message,
              }),
            };
          }
        }

        // Delete backup file if it exists
        const backupFile = `${scriptFilePath}${BACKUP_SUFFIX}`;
        try {
          await fs.unlink(backupFile);
          this.logger.debug("Backup file deleted", { backupFile });
        } catch (err: any) {
          // Backup file might not exist, which is fine
          if (err.code !== "ENOENT") {
            this.logger.debug("Failed to delete backup file", { backupFile, error: err.message });
          }
        }
      }

      // Update index by removing all deleted entries
      const updatedEntries = indexResult.value.entries.filter(e => !ids.includes(e.id));
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);
      const tempPath = `${indexPath}${TEMP_SUFFIX}`;
      await fs.writeFile(tempPath, JSON.stringify({ entries: updatedEntries }, null, 2), { encoding: "utf8" });
      
      // Create backup if file exists
      try {
        await fs.access(indexPath);
        await fs.copyFile(indexPath, `${indexPath}${BACKUP_SUFFIX}`);
      } catch {
        // File doesn't exist, no backup needed
      }
      
      // Atomic move
      await fs.rename(tempPath, indexPath);

      this.logger.log("Scripts deleted successfully", { ids, count: entriesToDelete.length });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error("Failed to delete scripts", {
        error: err.message,
        ids,
      });
      return {
        ok: false,
        error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, {
          originalError: err.message,
        }),
      };
    }
  }
}
