import { IScriptRepository } from '../../core/domain/ports/IScriptService';
import { Script, ScriptIndex, ScriptCollection } from '../../core/domain/models/Script';
import { Result, isFailure } from '../../core/domain/models/Result';
import { validateScript, validateScriptIndex, validateScriptCollection } from '../../core/domain/schemas/SchemaRegistry';
import { ILoggerService } from '../../core/domain/ports/ILoggerService';
import { IEncryptionService } from '../../core/domain/ports/IEncryptionService';
import { IConfigService } from '../../core/domain/ports/IConfigService';
import { ScriptError, ErrorCode } from '../../core/domain/types/ErrorTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

const DEFAULT_SCRIPTS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'scripts');
const INDEX_FILE = 'index.json';
const TEMP_SUFFIX = '.tmp';
const BACKUP_SUFFIX = '.bak';

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
      if (!await this.pathExists(validatedScript.rootPath)) {
        this.logger.error('Root path does not exist', { rootPath: validatedScript.rootPath });
        return { ok: false, error: new ScriptError('Root path does not exist', ErrorCode.SCRIPT_PATH_INVALID, { rootPath: validatedScript.rootPath }) };
      }
      
      // Check for duplicate script command
      const existingScripts = await this.getScriptsByRootPath(validatedScript.rootPath);
      if (existingScripts.ok) {
        const duplicate = existingScripts.value.find(s => s.script === validatedScript.script);
        if (duplicate) {
          this.logger.error('Duplicate script command found', { script: validatedScript.script, rootPath: validatedScript.rootPath });
          return { ok: false, error: new ScriptError('Script command already exists', ErrorCode.SCRIPT_DUPLICATE, { script: validatedScript.script, rootPath: validatedScript.rootPath }) };
        }
      }
      
      // Get or create script collection for this rootPath
      const collection = await this.getOrCreateScriptCollection(validatedScript.rootPath);
      if (isFailure(collection)) {
        return { ok: false, error: collection.error };
      }
      
      // Add script to collection
      collection.value.scripts.push(validatedScript);
      
      // Save collection
      const saveResult = await this.saveScriptCollection(validatedScript.rootPath, collection.value);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      
      // Update index
      await this.updateIndexForRootPath(validatedScript.rootPath);
      
      this.logger.log('Script created successfully', { name: validatedScript.name, rootPath: validatedScript.rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to create script', { error: err.message, script });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async createScripts(scripts: Script[]): Promise<Result<void>> {
    try {
      if (scripts.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug('Creating multiple scripts', { count: scripts.length });
      
      // Group scripts by rootPath for efficient processing
      const scriptsByRootPath = new Map<string, Script[]>();
      for (const script of scripts) {
        const validatedScript = validateScript(script);
        
        // Check if rootPath exists
        if (!await this.pathExists(validatedScript.rootPath)) {
          this.logger.error('Root path does not exist', { rootPath: validatedScript.rootPath });
          return { ok: false, error: new ScriptError('Root path does not exist', ErrorCode.SCRIPT_PATH_INVALID, { rootPath: validatedScript.rootPath }) };
        }
        
        if (!scriptsByRootPath.has(validatedScript.rootPath)) {
          scriptsByRootPath.set(validatedScript.rootPath, []);
        }
        scriptsByRootPath.get(validatedScript.rootPath)!.push(validatedScript);
      }

      // Process each rootPath group
      for (const [rootPath, rootScripts] of scriptsByRootPath) {
        // Get existing scripts for this rootPath
        const existingScripts = await this.getScriptsByRootPath(rootPath);
        const existingCollection = existingScripts.ok ? existingScripts.value : [];
        
        // Check for duplicates across existing and new scripts
        const allScripts = [...existingCollection, ...rootScripts];
        const scriptCommands = new Set<string>();
        const duplicates: string[] = [];
        
        for (const script of allScripts) {
          if (scriptCommands.has(script.script)) {
            duplicates.push(script.script);
          } else {
            scriptCommands.add(script.script);
          }
        }
        
        if (duplicates.length > 0) {
          this.logger.error('Duplicate script commands found', { duplicates, rootPath });
          return { ok: false, error: new ScriptError('Duplicate script commands found', ErrorCode.SCRIPT_DUPLICATE, { duplicates, rootPath }) };
        }
        
        // Create or update collection
        const collection: ScriptCollection = { scripts: allScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
        
        // Update index
        await this.updateIndexForRootPath(rootPath);
      }
      
      this.logger.log('Multiple scripts created successfully', { count: scripts.length });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to create multiple scripts', { error: err.message, count: scripts.length });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>> {
    try {
      const collection = await this.loadScriptCollection(rootPath);
      if (isFailure(collection)) {
        return { ok: true, value: [] }; // Return empty array if no scripts exist
      }
      return { ok: true, value: collection.value.scripts };
    } catch (err: any) {
      this.logger.error('Failed to get scripts by root path', { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
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
        const scripts = await this.getScriptsByRootPath(entry.rootPath);
        if (scripts.ok) {
          allScripts.push(...scripts.value);
        }
      }
      
      return { ok: true, value: allScripts };
    } catch (err: any) {
      this.logger.error('Failed to get all scripts', { error: err.message });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async updateScript(name: string, rootPath: string, scriptUpdate: Partial<Script>): Promise<Result<void>> {
    try {
      const scripts = await this.getScriptsByRootPath(rootPath);
      if (isFailure(scripts)) {
        return { ok: false, error: scripts.error };
      }
      
      const scriptIndex = scripts.value.findIndex(s => s.name === name);
      if (scriptIndex === -1) {
        this.logger.error('Script not found', { name, rootPath });
        return { ok: false, error: new ScriptError('Script not found', ErrorCode.SCRIPT_NOT_FOUND, { name, rootPath }) };
      }
      
      // Update script
      const updatedScript = { ...scripts.value[scriptIndex], ...scriptUpdate };
      const validatedScript = validateScript(updatedScript);
      
      // Check for duplicate script command (excluding the current script)
      const duplicate = scripts.value.find(s => s.script === validatedScript.script && s.name !== name);
      if (duplicate) {
        this.logger.error('Duplicate script command found', { script: validatedScript.script, rootPath });
        return { ok: false, error: new ScriptError('Script command already exists', ErrorCode.SCRIPT_DUPLICATE, { script: validatedScript.script, rootPath }) };
      }
      
      // Update in collection
      scripts.value[scriptIndex] = validatedScript;
      const collection: ScriptCollection = { scripts: scripts.value };
      
      // Save collection
      const saveResult = await this.saveScriptCollection(rootPath, collection);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      
      this.logger.log('Script updated successfully', { name, rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to update script', { error: err.message, name, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async updateScripts(updates: Array<{ name: string; rootPath: string; script: Partial<Script> }>): Promise<Result<void>> {
    try {
      if (updates.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug('Updating multiple scripts', { count: updates.length });
      
      // Group updates by rootPath for efficient processing
      const updatesByRootPath = new Map<string, Array<{ name: string; script: Partial<Script> }>>();
      for (const update of updates) {
        if (!updatesByRootPath.has(update.rootPath)) {
          updatesByRootPath.set(update.rootPath, []);
        }
        updatesByRootPath.get(update.rootPath)!.push({ name: update.name, script: update.script });
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
          const scriptIndex = updatedScripts.findIndex(s => s.name === update.name);
          if (scriptIndex === -1) {
            this.logger.error('Script not found for update', { name: update.name, rootPath });
            return { ok: false, error: new ScriptError('Script not found', ErrorCode.SCRIPT_NOT_FOUND, { name: update.name, rootPath }) };
          }
          
          // Update script
          const updatedScript = { ...updatedScripts[scriptIndex], ...update.script };
          const validatedScript = validateScript(updatedScript);
          updatedScripts[scriptIndex] = validatedScript;
          updatedNames.add(update.name);
        }
        
        // Check for duplicates (excluding updated scripts)
        const scriptCommands = new Set<string>();
        const duplicates: string[] = [];
        
        for (const script of updatedScripts) {
          if (scriptCommands.has(script.script)) {
            if (!updatedNames.has(script.name)) {
              duplicates.push(script.script);
            }
          } else {
            scriptCommands.add(script.script);
          }
        }
        
        if (duplicates.length > 0) {
          this.logger.error('Duplicate script commands found after updates', { duplicates, rootPath });
          return { ok: false, error: new ScriptError('Duplicate script commands found', ErrorCode.SCRIPT_DUPLICATE, { duplicates, rootPath }) };
        }
        
        // Save updated collection
        const collection: ScriptCollection = { scripts: updatedScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
      }
      
      this.logger.log('Multiple scripts updated successfully', { count: updates.length });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to update multiple scripts', { error: err.message, count: updates.length });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async deleteScript(name: string, rootPath: string): Promise<Result<void>> {
    try {
      const scripts = await this.getScriptsByRootPath(rootPath);
      if (isFailure(scripts)) {
        return { ok: false, error: scripts.error };
      }
      
      const scriptIndex = scripts.value.findIndex(s => s.name === name);
      if (scriptIndex === -1) {
        this.logger.error('Script not found', { name, rootPath });
        return { ok: false, error: new ScriptError('Script not found', ErrorCode.SCRIPT_NOT_FOUND, { name, rootPath }) };
      }
      
      // Remove script from collection
      scripts.value.splice(scriptIndex, 1);
      const collection: ScriptCollection = { scripts: scripts.value };
      
      // Save collection
      const saveResult = await this.saveScriptCollection(rootPath, collection);
      if (isFailure(saveResult)) {
        return { ok: false, error: saveResult.error };
      }
      
      this.logger.log('Script deleted successfully', { name, rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to delete script', { error: err.message, name, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async deleteScripts(scripts: Array<{ name: string; rootPath: string }>): Promise<Result<void>> {
    try {
      if (scripts.length === 0) {
        return { ok: true, value: undefined };
      }

      this.logger.debug('Deleting multiple scripts', { count: scripts.length });
      
      // Group deletions by rootPath for efficient processing
      const deletionsByRootPath = new Map<string, string[]>();
      for (const script of scripts) {
        if (!deletionsByRootPath.has(script.rootPath)) {
          deletionsByRootPath.set(script.rootPath, []);
        }
        deletionsByRootPath.get(script.rootPath)!.push(script.name);
      }

      // Process each rootPath group
      for (const [rootPath, scriptNames] of deletionsByRootPath) {
        const existingScripts = await this.getScriptsByRootPath(rootPath);
        if (isFailure(existingScripts)) {
          return { ok: false, error: existingScripts.error };
        }
        
        const remainingScripts = existingScripts.value.filter(script => !scriptNames.includes(script.name));
        
        // Check if all requested scripts were found
        const foundNames = existingScripts.value.filter(script => scriptNames.includes(script.name)).map(s => s.name);
        const missingNames = scriptNames.filter(name => !foundNames.includes(name));
        
        if (missingNames.length > 0) {
          this.logger.error('Some scripts not found for deletion', { missingNames, rootPath });
          return { ok: false, error: new ScriptError('Some scripts not found', ErrorCode.SCRIPT_NOT_FOUND, { missingNames, rootPath }) };
        }
        
        // Save updated collection
        const collection: ScriptCollection = { scripts: remainingScripts };
        const saveResult = await this.saveScriptCollection(rootPath, collection);
        if (isFailure(saveResult)) {
          return { ok: false, error: saveResult.error };
        }
      }
      
      this.logger.log('Multiple scripts deleted successfully', { count: scripts.length });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to delete multiple scripts', { error: err.message, count: scripts.length });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
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
      
      this.logger.log('Scripts deleted for root path', { rootPath });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to delete scripts by root path', { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  async loadScriptIndex(): Promise<Result<ScriptIndex>> {
    try {
      await this.ensureScriptsDir();
      const indexPath = path.join(this.scriptsDir, INDEX_FILE);
      
      try {
        const raw = await fs.readFile(indexPath, { encoding: 'utf8' });
        let data = raw;
        
        // Check if encrypted
        if (raw.startsWith('ENCRYPTED_v1')) {
          const config = await this.configService.getConfig();
          if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
            const decrypted = await this.encryption.decrypt(raw, config.value.encryption.encryptionKey);
            if (isFailure(decrypted)) {
              this.logger.error('Failed to decrypt script index', { error: decrypted.error });
              return { ok: false, error: decrypted.error };
            }
            data = decrypted.value;
          }
        }
        
        const parsed = JSON.parse(data);
        const index = validateScriptIndex(parsed);
        this.logger.debug('Script index loaded', { indexPath });
        return { ok: true, value: index };
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          // Create default index
          const defaultIndex: ScriptIndex = { entries: [] };
          await this.saveScriptIndex(defaultIndex);
          return { ok: true, value: defaultIndex };
        }
        throw err;
      }
    } catch (err: any) {
      this.logger.error('Failed to load script index', { error: err.message });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
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
      if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
        const encResult = await this.encryption.encrypt(data, config.value.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error('Failed to encrypt script index', { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      
      // Atomic write
      const tempPath = indexPath + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(indexPath, indexPath + BACKUP_SUFFIX).catch(() => {});
      await fs.rename(tempPath, indexPath);
      
      this.logger.log('Script index saved', { indexPath, encrypted });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to save script index', { error: err.message });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
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

  private async getOrCreateScriptCollection(rootPath: string): Promise<Result<ScriptCollection>> {
    const collection = await this.loadScriptCollection(rootPath);
    if (collection.ok) {
      return collection;
    }
    return { ok: true, value: { scripts: [] } };
  }

  private async loadScriptCollection(rootPath: string): Promise<Result<ScriptCollection>> {
    try {
      const referenceFile = await this.getReferenceFilePath(rootPath);
      if (!referenceFile) {
        return { ok: false, error: new ScriptError('Reference file not found', ErrorCode.SCRIPT_NOT_FOUND, { rootPath }) };
      }
      
      const raw = await fs.readFile(referenceFile, { encoding: 'utf8' });
      let data = raw;
      
      // Check if encrypted
      if (raw.startsWith('ENCRYPTED_v1')) {
        const config = await this.configService.getConfig();
        if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
          const decrypted = await this.encryption.decrypt(raw, config.value.encryption.encryptionKey);
          if (isFailure(decrypted)) {
            this.logger.error('Failed to decrypt script collection', { error: decrypted.error });
            return { ok: false, error: decrypted.error };
          }
          data = decrypted.value;
        }
      }
      
      const parsed = JSON.parse(data);
      const collection = validateScriptCollection(parsed);
      return { ok: true, value: collection };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return { ok: false, error: new ScriptError('Script collection not found', ErrorCode.SCRIPT_NOT_FOUND, { rootPath }) };
      }
      this.logger.error('Failed to load script collection', { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  private async saveScriptCollection(rootPath: string, collection: ScriptCollection): Promise<Result<void>> {
    try {
      const validated = validateScriptCollection(collection);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;
      
      // Check if encryption is enabled
      const config = await this.configService.getConfig();
      if (config.ok && config.value.encryption?.enabled && config.value.encryption.encryptionKey) {
        const encResult = await this.encryption.encrypt(data, config.value.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error('Failed to encrypt script collection', { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      
      const referenceFile = await this.getOrCreateReferenceFilePath(rootPath);
      const tempPath = referenceFile + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(referenceFile, referenceFile + BACKUP_SUFFIX).catch(() => {});
      await fs.rename(tempPath, referenceFile);
      
      this.logger.debug('Script collection saved', { referenceFile, encrypted });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to save script collection', { error: err.message, rootPath });
      return { ok: false, error: new ScriptError(err.message, ErrorCode.SCRIPT_INVALID, { originalError: err.message }) };
    }
  }

  private async getReferenceFilePath(rootPath: string): Promise<string | null> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return null;
    }
    
    const entry = index.value.entries.find(e => e.rootPath === rootPath);
    return entry ? path.join(this.scriptsDir, entry.referenceFile) : null;
  }

  private async getOrCreateReferenceFilePath(rootPath: string): Promise<string> {
    const existingPath = await this.getReferenceFilePath(rootPath);
    if (existingPath) {
      return existingPath;
    }
    
    // Create new reference file path
    const fileName = `${Buffer.from(rootPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '')}.json`;
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
    const existingIndex = index.value.entries.findIndex(e => e.rootPath === rootPath);
    if (existingIndex >= 0) {
      index.value.entries[existingIndex].referenceFile = relativePath;
    } else {
      index.value.entries.push({ rootPath, referenceFile: relativePath });
    }
    
    await this.saveScriptIndex(index.value);
  }

  private async removeFromIndex(rootPath: string): Promise<void> {
    const index = await this.loadScriptIndex();
    if (isFailure(index)) {
      return;
    }
    
    index.value.entries = index.value.entries.filter(e => e.rootPath !== rootPath);
    await this.saveScriptIndex(index.value);
  }
} 