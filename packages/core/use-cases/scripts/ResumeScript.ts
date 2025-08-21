import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { TerminalFacade } from '@codestate/core/infrastructure/services/Terminal/TerminalFacade';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class ResumeScript {
  private terminalService: ITerminalService;
  private scriptService: ScriptFacade;
  
  constructor(terminalService?: ITerminalService) {
    this.terminalService = terminalService || new TerminalFacade();
    this.scriptService = new ScriptFacade();
  }
  
  async execute(scriptId: string): Promise<Result<void>> {
    try {
      // Get script by ID
      const scriptResult = await this.scriptService.getScriptById(scriptId);
      if (!scriptResult.ok) {
        return { ok: false, error: scriptResult.error };
      }

      const targetScript = scriptResult.value;
      const targetRootPath = targetScript.rootPath;

      // Execute the script based on execution mode
      const executionMode = (targetScript as any).executionMode || 'same-terminal';
      
      if (targetScript.script) {
        // Legacy single command format
        if (executionMode === 'new-terminals') {
          // Check if terminal should close after execution
          const closeAfterExecution = (targetScript as any).closeTerminalAfterExecution || false;
          
          // Modify command based on close behavior
          let finalCommand = targetScript.script;
          if (closeAfterExecution) {
            finalCommand = `${targetScript.script} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
          } else {
            finalCommand = `${targetScript.script} && echo 'Script execution completed. Terminal will remain open.'`;
          }
          
          const spawnResult = await this.terminalService.spawnTerminal(finalCommand, {
            cwd: targetRootPath,
            timeout: 5000,
          });
          
          if (spawnResult.ok) {
            return { ok: true, value: undefined };
          } else {
            return { ok: false, error: spawnResult.error };
          }
        } else {
          // Same terminal execution
          const scriptResult = await this.terminalService.execute(targetScript.script, {
            cwd: targetRootPath,
            timeout: 30000,
          });
          
          if (scriptResult.ok && scriptResult.value.success) {
            return { ok: true, value: undefined };
          } else {
            return { ok: false, error: new Error(`Script execution failed: ${scriptResult.ok ? scriptResult.value.stderr : scriptResult.error}`) };
          }
        }
      } else if ((targetScript as any).commands && (targetScript as any).commands.length > 0) {
        // New multi-command format
        const commands = (targetScript as any).commands;
        const closeAfterExecution = (targetScript as any).closeTerminalAfterExecution || false;
        
        if (executionMode === 'new-terminals') {
          const combinedCommand = commands
            .sort((a: any, b: any) => a.priority - b.priority)
            .map((cmd: any) => cmd.command)
            .join(' && ');

          let finalCommand = combinedCommand;
          if (closeAfterExecution) {
            finalCommand = `${combinedCommand} && echo "Script execution completed. Closing terminal..." && sleep 2 && exit`;
          } else {
            finalCommand = `${combinedCommand} && echo 'Script execution completed. Terminal will remain open.'`;
          }

          const spawnResult = await this.terminalService.spawnTerminal(finalCommand, {
            cwd: targetRootPath,
            timeout: 5000,
          });

          if (spawnResult.ok) {
            return { ok: true, value: undefined };
          } else {
            return { ok: false, error: spawnResult.error };
          }
        } else {
          // Execute commands in sequence in the same terminal
          for (const command of commands) {
            const executeResult = await this.terminalService.execute(command.command, {
              cwd: targetRootPath,
              timeout: 30000,
            });
            
            if (!executeResult.ok || !executeResult.value.success) {
              return { ok: false, error: new Error(`Command '${command.command}' failed`) };
            }
            
            // Small delay between commands
            if (command.priority < commands.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
          
          return { ok: true, value: undefined };
        }
      } else {
        return { ok: false, error: new Error('Script has no executable content') };
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error('Unknown error during script execution') };
    }
  }
} 