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

  async getTerminalCollectionById(id: string): Promise<Result<TerminalCollection>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollectionById called', { id });
    
    const result = await this.repository.getTerminalCollectionById(id);
    if (isFailure(result)) {
      this.logger.error('Failed to get terminal collection by ID', { error: result.error, id });
    } else {
      this.logger.log('Terminal collection retrieved successfully by ID', { id });
    }
    return result;
  }

  async getTerminalCollections(options?: { rootPath?: string; lifecycle?: LifecycleEvent; loadScripts?: boolean }): Promise<Result<TerminalCollection[] | TerminalCollectionWithScripts[]>> {
    this.logger.debug('TerminalCollectionService.getTerminalCollections called', { options });
    
    const result = await this.repository.getTerminalCollections(options);
    if (isFailure(result)) {
      this.logger.error('Failed to get terminal collections', { error: result.error, options });
    } else {
      this.logger.log('Terminal collections retrieved successfully', { options, count: result.value.length });
    }
    return result;
  }

  async updateTerminalCollection(id: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.updateTerminalCollection called', { id, terminalCollectionUpdate });
    
    const result = await this.repository.updateTerminalCollection(id, terminalCollectionUpdate);
    if (isFailure(result)) {
      this.logger.error('Failed to update terminal collection', { error: result.error, id });
    } else {
      this.logger.log('Terminal collection updated successfully', { id });
    }
    return result;
  }

  async deleteTerminalCollections(ids: string[]): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.deleteTerminalCollections called', { ids });
    
    const result = await this.repository.deleteTerminalCollections(ids);
    if (isFailure(result)) {
      this.logger.error('Failed to delete terminal collections', { error: result.error, ids });
      } else {
      this.logger.log('Terminal collections deleted successfully', { ids });
    }
    return result;
  }

  async executeTerminalCollectionById(id: string): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionService.executeTerminalCollectionById called', { id });
    
    // Get the terminal collection with loaded scripts by ID
    const terminalCollectionResult = await this.getTerminalCollectionById(id);
    if (isFailure(terminalCollectionResult)) {
      return terminalCollectionResult;
    }

    const terminalCollection = terminalCollectionResult.value;
    const targetRootPath = terminalCollection.rootPath;
    
    // Execute each script in the terminal collection
    for (const scriptRef of terminalCollection.scriptReferences) {
      // TODO: We need to implement getScriptById in the script service
      // For now, we'll need to get all scripts and find by ID
      const allScriptsResult = await this.scriptService.getScripts();
      if (isFailure(allScriptsResult)) {
        this.logger.error('Failed to get scripts for terminal collection', { error: allScriptsResult.error, id });
        return allScriptsResult;
      }
      
      const script = allScriptsResult.value.find((s: any) => s.id === scriptRef.id && s.rootPath === scriptRef.rootPath);
      if (!script) {
        this.logger.warn('Script not found for reference', { scriptId: scriptRef.id, rootPath: scriptRef.rootPath });
        continue;
      }

      // Get execution mode from script, default to new-terminals for terminal collections
      const executionMode = (script as any).executionMode || 'new-terminals';
      
      // Terminal collection setting takes precedence over individual script settings
      const terminalCollectionCloseAfterExecution = (terminalCollection as any).closeTerminalAfterExecution || false;
      
      if (script.commands && script.commands.length > 0) {
        // Execute commands in order of priority
        const sortedCommands = script.commands.sort((a: any, b: any) => a.priority - b.priority);
        
        if (executionMode === 'new-terminals') {
          // Create a combined command that runs all commands in sequence
          const combinedCommand = sortedCommands
            .map((cmd: any) => cmd.command)
            .join(' && ');
          
          // Terminal collection setting takes precedence over individual script settings
          const closeAfterExecution = terminalCollectionCloseAfterExecution;
          
          // Modify command based on close behavior
          let finalCommand = combinedCommand;
          if (closeAfterExecution) {
            finalCommand = `${combinedCommand} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
          } else {
            finalCommand = `${combinedCommand} && echo 'Script execution completed. Terminal will remain open.'`;
          }
          
          const spawnResult = await this.terminalService.spawnTerminalCommand({
            command: finalCommand,
            cwd: targetRootPath
          });
          
          if (isFailure(spawnResult)) {
            this.logger.error('Failed to spawn terminal for script', { error: spawnResult.error, scriptName: script.name });
            return spawnResult;
          }
        } else {
          // Execute commands in sequence in the same terminal
          for (const command of sortedCommands) {
            const executeResult = await this.terminalService.executeCommand({
              command: command.command,
              cwd: targetRootPath
            });
            
            if (isFailure(executeResult)) {
              this.logger.error('Failed to execute command', { error: executeResult.error, command: command.command });
              return executeResult;
            }
            
            if (!executeResult.value.success) {
              this.logger.error('Command execution failed', { 
                command: command.command, 
                exitCode: executeResult.value.exitCode,
                stderr: executeResult.value.stderr 
              });
              return { ok: false, error: new Error(`Command '${command.command}' failed with exit code ${executeResult.value.exitCode}`) };
            }
            
            // Small delay between commands
            if (command.priority < sortedCommands.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
      } else if (script.script) {
        // Execute legacy single script
        if (executionMode === 'new-terminals') {
          // Terminal collection setting takes precedence over individual script settings
          const closeAfterExecution = terminalCollectionCloseAfterExecution;
          
          // Modify command based on close behavior
          let finalCommand = script.script;
          if (closeAfterExecution) {
            finalCommand = `${script.script} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
          } else {
            finalCommand = `${script.script} && echo 'Script execution completed. Terminal will remain open.'`;
          }
          
          const spawnResult = await this.terminalService.spawnTerminalCommand({
            command: finalCommand,
            cwd: targetRootPath
          });
          
          if (isFailure(spawnResult)) {
            this.logger.error('Failed to spawn terminal for legacy script', { error: spawnResult.error, script: script.script });
            return spawnResult;
          }
        } else {
          const executeResult = await this.terminalService.executeCommand({
            command: script.script,
            cwd: targetRootPath
          });
          
          if (isFailure(executeResult)) {
            this.logger.error('Failed to execute legacy script', { error: executeResult.error, script: script.script });
            return executeResult;
          }
          
          if (!executeResult.value.success) {
            this.logger.error('Legacy script execution failed', { 
              script: script.script, 
              exitCode: executeResult.value.exitCode,
              stderr: executeResult.value.stderr 
            });
            return { ok: false, error: new Error(`Script '${script.script}' failed with exit code ${executeResult.value.exitCode}`) };
          }
        }
        
        // Small delay between scripts
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return { ok: true, value: undefined };
  }
}
