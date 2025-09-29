import { ITerminalCollectionService } from '../../domain/ports/ITerminalCollectionService';
import { ITerminalCollectionRepository } from '../../domain/ports/ITerminalCollectionRepository';
import { ITerminalService } from '../../domain/ports/ITerminalService';
import { IScriptService } from '../../domain/ports/IScriptService';
import { TerminalCollection, TerminalCollectionWithScripts } from '../../domain/models/TerminalCollection';
import { LifecycleEvent } from '../../domain/models/Script';
import { Result, isSuccess, isFailure } from '../../domain/models/Result';
import { ILoggerService } from '../../domain/ports/ILoggerService';
import { ITerminalHandler } from '../../infrastructure/services/Terminal/handlers/ITerminalHandler';
import { platform } from 'os';
import { MacOSTerminalHandler } from '../../infrastructure/services/Terminal/handlers/MacOSTerminalHandler';
import { WindowsTerminalHandler } from '../../infrastructure/services/Terminal/handlers/WindowsTerminalHandler';
import { LinuxTerminalHandler } from '../../infrastructure/services/Terminal/handlers/LinuxTerminalHandler';

export class TerminalCollectionService implements ITerminalCollectionService {
  private terminalHandler: ITerminalHandler;

  constructor(
    private repository: ITerminalCollectionRepository,
    private terminalService: ITerminalService,
    private scriptService: IScriptService,
    private logger: ILoggerService
  ) {
    // Initialize OS-specific terminal handler
    this.terminalHandler = this.createTerminalHandler();
  }

  private createTerminalHandler(): ITerminalHandler {
    const currentPlatform = platform();

    switch (currentPlatform) {
      case 'win32':
        return new WindowsTerminalHandler(this.logger);
      case 'darwin':
        return new MacOSTerminalHandler(this.logger);
      case 'linux':
        return new LinuxTerminalHandler(this.logger);
      default:
        this.logger.warn(`Unsupported platform: ${currentPlatform}, falling back to Linux handler`);
        return new LinuxTerminalHandler(this.logger);
    }
  }

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
    
    // Get execution mode from terminal collection, default to same-terminal for backward compatibility
    const executionMode = terminalCollection.executionMode || 'same-terminal';
    const terminalCollectionCloseAfterExecution = terminalCollection.closeTerminalAfterExecution || false;

    this.logger.debug('Executing terminal collection', {
      id,
      name: terminalCollection.name,
      executionMode,
      closeAfterExecution: terminalCollectionCloseAfterExecution,
      scriptCount: terminalCollection.scriptReferences.length,
      rootPath: targetRootPath
    });

    this.logger.log(`🚀 Executing terminal collection: "${terminalCollection.name}" (${executionMode} mode)`);

    // Check if terminal collection has any scripts
    if (terminalCollection.scriptReferences.length === 0) {
      this.logger.warn('Terminal collection has no scripts to execute', {
        id: terminalCollection.id,
        name: terminalCollection.name
      });
      return { ok: true, value: undefined };
    }

    // Handle different execution modes
    if (executionMode === 'multi-terminal') {
      return this.executeInMultiTerminalMode(terminalCollection, targetRootPath, terminalCollectionCloseAfterExecution);
    } else if (executionMode === 'same-terminal') {
      return this.executeInSameTerminalMode(terminalCollection, targetRootPath, terminalCollectionCloseAfterExecution);
    } else if (executionMode === 'ide') {
      // IDE mode is handled by IDE extension, not CLI
      this.logger.warn('IDE execution mode is not supported in CLI context', { id, executionMode });
      return { ok: false, error: new Error('IDE execution mode is not supported in CLI context') };
    } else {
      this.logger.error('Unknown execution mode', { id, executionMode });
      return { ok: false, error: new Error(`Unknown execution mode: ${executionMode}`) };
    }
  }

  private async executeInMultiTerminalMode(
    terminalCollection: TerminalCollection,
    targetRootPath: string,
    closeAfterExecution: boolean
  ): Promise<Result<void>> {
    this.logger.debug('Executing in multi-terminal mode', { id: terminalCollection.id });

    // Execute each script in a separate terminal
    for (const scriptRef of terminalCollection.scriptReferences) {
      const scriptResult = await this.getScriptById(scriptRef.id, scriptRef.rootPath);
      if (isFailure(scriptResult)) {
        this.logger.error('Failed to get script for terminal collection', { error: scriptResult.error, scriptId: scriptRef.id });
        return scriptResult;
      }

      const script = scriptResult.value;
      const finalCommand = this.buildFinalCommand(script, closeAfterExecution);
          
          const spawnResult = await this.terminalService.spawnTerminalCommand({
            command: finalCommand,
            cwd: targetRootPath
          });
          
          if (isFailure(spawnResult)) {
            this.logger.error('Failed to spawn terminal for script', { error: spawnResult.error, scriptName: script.name });
            return spawnResult;
          }

      // Small delay between terminal spawns
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return { ok: true, value: undefined };
  }

  private async executeInSameTerminalMode(
    terminalCollection: TerminalCollection,
    targetRootPath: string,
    closeAfterExecution: boolean
  ): Promise<Result<void>> {
    this.logger.debug('Executing in same-terminal mode', { id: terminalCollection.id });

    // For same-terminal mode, try tabs if multiple scripts, otherwise sequential
    if (terminalCollection.scriptReferences.length > 1) {
      this.logger.debug('Multiple scripts detected, attempting tab-based execution');
      return this.executeWithTabsInSingleTerminal(terminalCollection, targetRootPath, closeAfterExecution);
        } else {
      this.logger.debug('Single script detected, using sequential execution');
      return this.executeAllScriptsInSingleTerminal(terminalCollection, targetRootPath, closeAfterExecution);
    }
  }

  private async executeWithTabsInSingleTerminal(
    terminalCollection: TerminalCollection,
    targetRootPath: string,
    closeAfterExecution: boolean
  ): Promise<Result<void>> {
    this.logger.debug('Executing with tabs in single terminal', {
      id: terminalCollection.id,
      scriptCount: terminalCollection.scriptReferences.length
    });

    const commands: string[] = [];
    const scriptNames: string[] = [];

    for (const scriptRef of terminalCollection.scriptReferences) {
      this.logger.debug('Processing script reference for tabs', { scriptId: scriptRef.id, rootPath: scriptRef.rootPath });

      const scriptResult = await this.getScriptById(scriptRef.id, scriptRef.rootPath);
      if (isFailure(scriptResult)) {
        this.logger.error('Failed to get script for terminal collection', { error: scriptResult.error, scriptId: scriptRef.id });
        return scriptResult;
      }

      const script = scriptResult.value;
      const command = this.buildCommandFromScript(script);

      // Log the complete command details
      this.logger.log('📋 TAB SCRIPT COMMAND DETAILS:', {
        scriptId: script.id,
        scriptName: script.name,
        scriptRootPath: script.rootPath,
        commandLength: command.length,
        completeCommand: command,
        scriptCommands: script.commands
      });

      commands.push(command);
      scriptNames.push(script.name);
    }

    if (commands.length === 0) {
      this.logger.warn('No scripts found in terminal collection for tabs', {
        id: terminalCollection.id,
        scriptReferences: terminalCollection.scriptReferences.length
      });
      return { ok: true, value: undefined };
    }

    // Add progress messages to each command
    const commandsWithProgress = commands.map((cmd, index) => {
      const scriptName = scriptNames[index];
      return `echo "🚀 Starting script ${index + 1}/${commands.length}: ${scriptName}" && ${cmd} && echo "✅ Completed script ${index + 1}/${commands.length}: ${scriptName}"`;
    });

    // Add final close behavior if needed (only if closeAfterExecution is true)
    if (closeAfterExecution) {
      commandsWithProgress.push('echo "🎉 All scripts completed successfully! Closing terminal..." && sleep 2 && exit');
    }

    this.logger.log('🔧 TAB COMMANDS:', {
      commandCount: commandsWithProgress.length,
      commands: commandsWithProgress,
      individualCommands: commands
    });

    // Use the terminal service to spawn with tabs
    const spawnResult = await this.terminalService.spawnTerminalWithTabs(
      commandsWithProgress.join(' && '),
      { cwd: targetRootPath, useTabs: true, tabCommands: commandsWithProgress }
    );

    if (isFailure(spawnResult)) {
      this.logger.error('Failed to spawn terminal with tabs', {
        error: spawnResult.error,
        commandCount: commandsWithProgress.length
      });

      // Fallback to sequential execution
      this.logger.warn('Falling back to sequential execution in single terminal');
      return this.executeAllScriptsInSingleTerminal(terminalCollection, targetRootPath, closeAfterExecution);
    }

    this.logger.log('Successfully spawned terminal with tabs', {
      id: terminalCollection.id,
      tabCount: commandsWithProgress.length
    });

    return { ok: true, value: undefined };
  }

  private async executeAllScriptsInSingleTerminal(
    terminalCollection: TerminalCollection,
    targetRootPath: string,
    closeAfterExecution: boolean
  ): Promise<Result<void>> {
    this.logger.debug('Executing all scripts in single terminal', {
      id: terminalCollection.id,
      scriptCount: terminalCollection.scriptReferences.length
    });

    // Build a combined command that runs all scripts sequentially
    const allCommands: string[] = [];
    const scriptNames: string[] = [];

    for (const scriptRef of terminalCollection.scriptReferences) {
      this.logger.debug('Processing script reference', { scriptId: scriptRef.id, rootPath: scriptRef.rootPath });

      const scriptResult = await this.getScriptById(scriptRef.id, scriptRef.rootPath);
      if (isFailure(scriptResult)) {
        this.logger.error('Failed to get script for terminal collection', { error: scriptResult.error, scriptId: scriptRef.id });
        return scriptResult;
      }

      const script = scriptResult.value;
      const command = this.buildCommandFromScript(script);

      // Log the complete command details
      this.logger.log('📋 SCRIPT COMMAND DETAILS:', {
        scriptId: script.id,
        scriptName: script.name,
        scriptRootPath: script.rootPath,
        commandLength: command.length,
        completeCommand: command,
        scriptCommands: script.commands
      });

      this.logger.debug('Built command from script', {
        scriptName: script.name,
        commandLength: command.length,
        commandPreview: command.substring(0, 100) + (command.length > 100 ? '...' : '')
      });

      allCommands.push(command);
      scriptNames.push(script.name);
    }

    if (allCommands.length === 0) {
      this.logger.warn('No scripts found in terminal collection', {
        id: terminalCollection.id,
        scriptReferences: terminalCollection.scriptReferences.length,
        scriptRefs: terminalCollection.scriptReferences.map(ref => ({ id: ref.id, rootPath: ref.rootPath }))
      });
      return { ok: true, value: undefined };
    }

    this.logger.debug('Combining scripts for single terminal execution', {
      scriptNames,
      commandCount: allCommands.length
    });

    // Combine all commands with && to run them sequentially
    // Add echo statements to show progress
    const commandsWithProgress = allCommands.map((cmd, index) => {
      const scriptName = scriptNames[index];
      return `echo "🚀 Starting script ${index + 1}/${allCommands.length}: ${scriptName}" && ${cmd} && echo "✅ Completed script ${index + 1}/${allCommands.length}: ${scriptName}"`;
    });

    const combinedCommand = commandsWithProgress.join(' && ');

    // Add final close behavior if needed
    let finalCommand = combinedCommand;
          if (closeAfterExecution) {
      finalCommand = `${combinedCommand} && echo "🎉 All scripts completed successfully! Closing terminal..." && sleep 2 && exit`;
          } else {
      finalCommand = `${combinedCommand} && echo "🎉 All scripts completed successfully! Terminal will remain open."`;
    }

    // Log the complete final command
    this.logger.log('🔧 FINAL COMBINED COMMAND:', {
      commandLength: finalCommand.length,
      closeAfterExecution,
      completeCommand: finalCommand,
      individualCommands: allCommands
    });

    this.logger.debug('Spawning single terminal with combined command', {
      commandLength: finalCommand.length,
      closeAfterExecution,
      commandPreview: finalCommand.substring(0, 200) + (finalCommand.length > 200 ? '...' : '')
    });

    // Check if command is too long (some terminals have limits)
    if (finalCommand.length > 8000) {
      this.logger.warn('Command is very long, using script file approach', { commandLength: finalCommand.length });
      return this.executeWithScriptFile(terminalCollection, targetRootPath, closeAfterExecution, finalCommand);
    }

    // Try to spawn a single terminal with the combined command
          const spawnResult = await this.terminalService.spawnTerminalCommand({
            command: finalCommand,
            cwd: targetRootPath
          });
          
          if (isFailure(spawnResult)) {
      this.logger.error('Failed to spawn terminal for combined scripts', {
        error: spawnResult.error,
        commandPreview: finalCommand.substring(0, 200) + (finalCommand.length > 200 ? '...' : ''),
        commandLength: finalCommand.length
      });

      // Try a simple test first to see if terminal spawning works at all
      this.logger.warn('Testing basic terminal spawning...');
      const testResult = await this.terminalService.spawnTerminalCommand({
        command: 'echo "Terminal test successful"',
            cwd: targetRootPath
          });
          
      if (isFailure(testResult)) {
        this.logger.error('Basic terminal spawning failed', { error: testResult.error });
        return testResult;
      }

      this.logger.warn('Basic terminal works, trying script file approach for complex command');
      return this.executeWithScriptFile(terminalCollection, targetRootPath, closeAfterExecution, finalCommand);
    }

    this.logger.log('Successfully spawned single terminal with all scripts', {
      id: terminalCollection.id,
      scriptCount: allCommands.length
    });

    return { ok: true, value: undefined };
  }

  private async getScriptById(scriptId: string, rootPath: string): Promise<Result<any>> {
    // TODO: We need to implement getScriptById in the script service
    // For now, we'll need to get all scripts and find by ID
    const allScriptsResult = await this.scriptService.getScripts();
    if (isFailure(allScriptsResult)) {
      return allScriptsResult;
    }

    const script = allScriptsResult.value.find((s: any) => s.id === scriptId && s.rootPath === rootPath);
    if (!script) {
      return { ok: false, error: new Error(`Script not found: ${scriptId} at ${rootPath}`) };
    }

    return { ok: true, value: script };
  }

  private buildFinalCommand(script: any, closeAfterExecution: boolean): string {
    let command: string;

    if (script.commands && script.commands.length > 0) {
      // Execute commands in order of priority
      const sortedCommands = script.commands.sort((a: any, b: any) => a.priority - b.priority);
      command = sortedCommands.map((cmd: any) => cmd.command).join(' && ');
    } else if (script.script) {
      // Legacy single script
      command = script.script;
    } else {
      throw new Error('Script has no commands or script content');
    }

    // Modify command based on close behavior
    if (closeAfterExecution) {
      return `${command} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
    } else {
      return `${command} && echo 'Script execution completed. Terminal will remain open.'`;
    }
  }

  private buildCommandFromScript(script: any): string {
    if (script.commands && script.commands.length > 0) {
      // Execute commands in order of priority
      const sortedCommands = script.commands.sort((a: any, b: any) => a.priority - b.priority);
      return sortedCommands.map((cmd: any) => cmd.command).join(' && ');
    } else if (script.script) {
      // Legacy single script
      return script.script;
    } else {
      throw new Error('Script has no commands or script content');
    }
  }

  private async checkTabSupport(terminalCmd: string): Promise<boolean> {
    // Check if the terminal handler supports tab functionality
    return 'getTerminalArgsWithTabs' in this.terminalHandler;
  }

  private async executeWithScriptFile(
    terminalCollection: TerminalCollection,
    targetRootPath: string,
    closeAfterExecution: boolean,
    command: string
  ): Promise<Result<void>> {
    this.logger.debug('Executing with script file fallback', { id: terminalCollection.id });

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Create a temporary script file
      const scriptFileName = `codestate-${terminalCollection.id}-${Date.now()}.sh`;
      const scriptPath = path.join(targetRootPath, scriptFileName);

      // Write the command to the script file
      await fs.writeFile(scriptPath, `#!/bin/bash\nset -e\n${command}\n`, { mode: 0o755 });

      this.logger.debug('Created temporary script file', { scriptPath, commandLength: command.length });

      // Execute the script file
      const spawnResult = await this.terminalService.spawnTerminalCommand({
        command: `./${scriptFileName}`,
        cwd: targetRootPath
      });

      if (isFailure(spawnResult)) {
        this.logger.error('Failed to spawn terminal for script file', { error: spawnResult.error, scriptPath });
        return spawnResult;
      }

      // Clean up the script file after a delay
      setTimeout(async () => {
        try {
          await fs.unlink(scriptPath);
          this.logger.debug('Cleaned up temporary script file', { scriptPath });
        } catch (error) {
          this.logger.warn('Failed to clean up temporary script file', { scriptPath, error });
        }
      }, 5000);

      this.logger.log('Successfully spawned terminal with script file', {
        id: terminalCollection.id,
        scriptPath
      });

    return { ok: true, value: undefined };

    } catch (error) {
      this.logger.error('Failed to execute with script file', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        ok: false,
        error: new Error(`Failed to execute with script file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      };
    }
  }
}
