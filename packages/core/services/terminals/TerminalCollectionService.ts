import { ITerminalCollectionService } from '../../domain/ports/ITerminalCollectionService';
import { ITerminalCollectionRepository } from '../../domain/ports/ITerminalCollectionRepository';
import { ITerminalService } from '../../domain/ports/ITerminalService';
import { IScriptService } from '../../domain/ports/IScriptService';
import { TerminalCollection, TerminalCollectionWithScripts } from '../../domain/models/TerminalCollection';
import { LifecycleEvent } from '../../domain/models/Script';
import { Result, isSuccess, isFailure } from '../../domain/models/Result';
import { ILoggerService } from '../../domain/ports/ILoggerService';

export class TerminalCollectionService implements ITerminalCollectionService {
  constructor(
    private repository: ITerminalCollectionRepository,
    private terminalService: ITerminalService,
    private scriptService: IScriptService,
    private logger: ILoggerService
  ) {}

  async createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.createTerminalCollection called', { terminalCollection });
    const result = await this.repository.createTerminalCollection(terminalCollection);
    if (isFailure(result)) {
      this.logger.error('Failed to create terminal collection', { error: result.error, terminalCollection });
    } else {
      this.logger.log('Terminal collection created successfully', { terminalCollection });
    }
    return result;
  }

  async getTerminalCollection(name: string, rootPath?: string): Promise<Result<TerminalCollection>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollection called', { name, rootPath });
    const result = await this.repository.getTerminalCollection(name, rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to get terminal collection', { error: result.error, name, rootPath });
    } else {
      this.logger.log('Terminal collection retrieved successfully', { name, rootPath });
    }
    return result;
  }

  async getTerminalCollectionWithScripts(name: string, rootPath?: string): Promise<Result<TerminalCollectionWithScripts>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollectionWithScripts called', { name, rootPath });
    
    // Get the terminal collection with references
    const terminalCollectionResult = await this.getTerminalCollection(name, rootPath);
    if (isFailure(terminalCollectionResult)) {
      return terminalCollectionResult;
    }

    const terminalCollection = terminalCollectionResult.value;
    
    // Load the actual scripts for each reference
    const scripts = [];
    for (const scriptRef of terminalCollection.scriptReferences) {
      // TODO: We need to implement getScriptById in the script service
      // For now, we'll need to get all scripts and find by ID
      const allScriptsResult = await this.scriptService.getAllScripts();
      if (isFailure(allScriptsResult)) {
        this.logger.error('Failed to get scripts for terminal collection', { error: allScriptsResult.error, name });
        return allScriptsResult;
      }
      
      const script = allScriptsResult.value.find(s => s.name === scriptRef.id && s.rootPath === scriptRef.rootPath);
      if (script) {
        scripts.push(script);
      } else {
        this.logger.warn('Script not found for reference', { scriptId: scriptRef.id, rootPath: scriptRef.rootPath });
      }
    }

    const terminalCollectionWithScripts: TerminalCollectionWithScripts = {
      name: terminalCollection.name,
      rootPath: terminalCollection.rootPath,
      lifecycle: terminalCollection.lifecycle,
      scripts: scripts
    };

    this.logger.log('Terminal collection with scripts retrieved successfully', { name, rootPath, scriptCount: scripts.length });
    return { ok: true, value: terminalCollectionWithScripts };
  }

  async getAllTerminalCollections(): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionService.getAllTerminalCollections called');
    const result = await this.repository.getAllTerminalCollections();
    if (isFailure(result)) {
      this.logger.error('Failed to get all terminal collections', { error: result.error });
    } else {
      this.logger.log('All terminal collections retrieved', { count: result.value.length });
    }
    return result;
  }

  async getAllTerminalCollectionsWithScripts(): Promise<Result<TerminalCollectionWithScripts[]>> {
    this.logger.debug('TerminalCollectionService.getAllTerminalCollectionsWithScripts called');
    
    // Get all terminal collections with references
    const terminalCollectionsResult = await this.getAllTerminalCollections();
    if (isFailure(terminalCollectionsResult)) {
      return terminalCollectionsResult;
    }

    const terminalCollections = terminalCollectionsResult.value;
    const terminalCollectionsWithScripts: TerminalCollectionWithScripts[] = [];

    // Load scripts for each terminal collection
    for (const terminalCollection of terminalCollections) {
      const withScriptsResult = await this.getTerminalCollectionWithScripts(terminalCollection.name, terminalCollection.rootPath);
      if (isSuccess(withScriptsResult)) {
        terminalCollectionsWithScripts.push(withScriptsResult.value);
      }
    }

    this.logger.log('All terminal collections with scripts retrieved', { count: terminalCollectionsWithScripts.length });
    return { ok: true, value: terminalCollectionsWithScripts };
  }

  async getTerminalCollectionsByRootPath(rootPath: string): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollectionsByRootPath called', { rootPath });
    const result = await this.repository.getTerminalCollectionsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to get terminal collections by root path', { error: result.error, rootPath });
    } else {
      this.logger.log('Terminal collections retrieved by root path', { rootPath, count: result.value.length });
    }
    return result;
  }

  async getTerminalCollectionsByRootPathWithScripts(rootPath: string): Promise<Result<TerminalCollectionWithScripts[]>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollectionsByRootPathWithScripts called', { rootPath });
    
    // Get terminal collections by root path with references
    const terminalCollectionsResult = await this.getTerminalCollectionsByRootPath(rootPath);
    if (isFailure(terminalCollectionsResult)) {
      return terminalCollectionsResult;
    }

    const terminalCollections = terminalCollectionsResult.value;
    const terminalCollectionsWithScripts: TerminalCollectionWithScripts[] = [];

    // Load scripts for each terminal collection
    for (const terminalCollection of terminalCollections) {
      const withScriptsResult = await this.getTerminalCollectionWithScripts(terminalCollection.name, terminalCollection.rootPath);
      if (isSuccess(withScriptsResult)) {
        terminalCollectionsWithScripts.push(withScriptsResult.value);
      }
    }

    this.logger.log('Terminal collections with scripts retrieved by root path', { rootPath, count: terminalCollectionsWithScripts.length });
    return { ok: true, value: terminalCollectionsWithScripts };
  }

  async getTerminalCollectionsByLifecycle(lifecycle: LifecycleEvent, rootPath: string): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollectionsByLifecycle called', { lifecycle, rootPath });
    const result = await this.repository.getTerminalCollectionsByLifecycle(lifecycle, rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to get terminal collections by lifecycle', { error: result.error, lifecycle, rootPath });
    } else {
      this.logger.log('Terminal collections retrieved by lifecycle', { lifecycle, rootPath, count: result.value.length });
    }
    return result;
  }

  async updateTerminalCollection(name: string, rootPath: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.updateTerminalCollection called', { name, rootPath, terminalCollectionUpdate });
    const result = await this.repository.updateTerminalCollection(name, rootPath, terminalCollectionUpdate);
    if (isFailure(result)) {
      this.logger.error('Failed to update terminal collection', { error: result.error, name, rootPath });
    } else {
      this.logger.log('Terminal collection updated successfully', { name, rootPath });
    }
    return result;
  }

  async deleteTerminalCollection(name: string, rootPath: string): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.deleteTerminalCollection called', { name, rootPath });
    const result = await this.repository.deleteTerminalCollection(name, rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to delete terminal collection', { error: result.error, name, rootPath });
    } else {
      this.logger.log('Terminal collection deleted successfully', { name, rootPath });
    }
    return result;
  }

  async deleteTerminalCollectionsByRootPath(rootPath: string): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.deleteTerminalCollectionsByRootPath called', { rootPath });
    const result = await this.repository.deleteTerminalCollectionsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to delete terminal collections by root path', { error: result.error, rootPath });
    } else {
      this.logger.log('Terminal collections deleted by root path', { rootPath });
    }
    return result;
  }

  async executeTerminalCollection(name: string, rootPath?: string): Promise<Result<void>> {
    // Use current directory as default if no rootPath provided
    const targetRootPath = rootPath || process.cwd();
    this.logger.debug('TerminalCollectionService.executeTerminalCollection called', { name, rootPath: targetRootPath });
    
    // Get the terminal collection with loaded scripts
    const terminalCollectionResult = await this.getTerminalCollectionWithScripts(name, targetRootPath);
    if (isFailure(terminalCollectionResult)) {
      return terminalCollectionResult;
    }

    const terminalCollection = terminalCollectionResult.value;

    // Execute each script in the terminal collection
    for (const script of terminalCollection.scripts) {
      this.logger.debug('Executing script in terminal collection', { scriptName: script.name, terminalCollectionName: name });
      
      if (script.commands && script.commands.length > 0) {
        // Execute commands in order of priority
        const sortedCommands = script.commands.sort((a, b) => a.priority - b.priority);
        
        for (const command of sortedCommands) {
          this.logger.debug('Executing command', { commandName: command.name, command: command.command });
          
          const terminalResult = await this.terminalService.executeCommand({
            command: command.command,
            cwd: targetRootPath
          });
          
          if (isFailure(terminalResult)) {
            this.logger.error('Failed to execute command', { error: terminalResult.error, command: command.command });
            return terminalResult;
          }
          
          if (!terminalResult.value.success) {
            this.logger.error('Command execution failed', { 
              command: command.command, 
              exitCode: terminalResult.value.exitCode,
              stderr: terminalResult.value.stderr 
            });
            return { ok: false, error: new Error(`Command '${command.command}' failed with exit code ${terminalResult.value.exitCode}`) };
          }
          
          this.logger.log('Command executed successfully', { commandName: command.name, command: command.command });
        }
      } else if (script.script) {
        // Execute legacy single script
        this.logger.debug('Executing legacy script', { script: script.script });
        
        const terminalResult = await this.terminalService.executeCommand({
          command: script.script,
          cwd: targetRootPath
        });
        
        if (isFailure(terminalResult)) {
          this.logger.error('Failed to execute legacy script', { error: terminalResult.error, script: script.script });
          return terminalResult;
        }
        
        if (!terminalResult.value.success) {
          this.logger.error('Legacy script execution failed', { 
            script: script.script, 
            exitCode: terminalResult.value.exitCode,
            stderr: terminalResult.value.stderr 
          });
          return { ok: false, error: new Error(`Script '${script.script}' failed with exit code ${terminalResult.value.exitCode}`) };
        }
        
        this.logger.log('Legacy script executed successfully', { script: script.script });
      }
    }

    this.logger.log('Terminal collection executed successfully', { name, rootPath: targetRootPath });
    return { ok: true, value: undefined };
  }
}
