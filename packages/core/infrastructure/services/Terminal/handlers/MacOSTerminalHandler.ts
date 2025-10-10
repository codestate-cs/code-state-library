import { ITerminalHandler, TerminalArgsOptions } from './ITerminalHandler';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { Result } from '@codestate/core/domain/models/Result';

export class MacOSTerminalHandler implements ITerminalHandler {
  constructor(private logger: ILoggerService) {}

  async detectTerminal(): Promise<string> {
    // On macOS, use 'osascript' to execute AppleScript directly
    // This is the most reliable way to open terminals on macOS
    this.logger.debug('macOS terminal detection: using osascript command');
    return 'osascript';
  }

  getTerminalArgs(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'osascript') {
      // macOS Terminal.app via osascript command
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      this.logger.log('🍎 GENERATED APPLESCRIPT:', { 
        appleScript, 
        command, 
        cwd,
        formattedScript: appleScript.replace(/\n/g, '\\n')
      });
      args.push('-e', appleScript);
    } else if (terminalCmd === 'open') {
      // macOS Terminal.app via open command
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      this.logger.debug('Generated AppleScript for Terminal.app via open', { appleScript, command, cwd });
      args.push('-e', appleScript);
    } else if (terminalCmd === 'Terminal.app') {
      // Direct Terminal.app usage
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      this.logger.debug('Generated AppleScript for Terminal.app direct', { appleScript, command, cwd });
      args.push('-e', appleScript);
    } else if (terminalCmd === 'iTerm2') {
      // iTerm2 with AppleScript
      const appleScript = this.buildiTermScript(command, cwd);
      this.logger.debug('Generated AppleScript for iTerm2', { appleScript, command, cwd });
      args.push('-e', appleScript);
    }
    
    return args;
  }

  getTerminalArgsForApp(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'osascript') {
      // macOS - use AppleScript to execute command
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      args.push('-e', appleScript);
    } else if (terminalCmd === 'open') {
      // macOS - use AppleScript to execute command
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      args.push('-e', appleScript);
    } else if (terminalCmd === 'Terminal.app') {
      // Direct Terminal.app
      const appleScript = this.buildTerminalWithTabsScript([command], cwd);
      args.push('-e', appleScript);
    } else if (terminalCmd === 'iTerm2') {
      // iTerm2
      const appleScript = this.buildiTermScript(command, cwd);
      args.push('-e', appleScript);
    }
    
    return args;
  }

  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      // On macOS, use 'command -v' which is POSIX compliant and works reliably
      // Unlike 'which', 'command -v' doesn't require flags and is more portable
      const result = await this.executeCommand({ 
        command: `command -v ${command}`, 
        timeout: 3000 
      });
      return result.ok && result.value.success;
    } catch (error) {
      this.logger.debug(`Command availability check failed for ${command}`, { error });
      return false;
    }
  }

  /**
   * Enhanced method to get terminal args with tab support using AppleScript
   */
  getTerminalArgsWithTabs(options: TerminalArgsOptions): string[] {
    const { shell, command, cwd, title, useTabs } = options;
    
    if (useTabs) {
      if (shell === 'Terminal.app' || shell === 'open') {
        // Use AppleScript to open new tab in Terminal.app
        const appleScript = this.buildTerminalTabScript(command, cwd, title);
        return ['-e', appleScript];
      } else if (shell === 'iTerm2') {
        // Use AppleScript to open new tab in iTerm2
        const appleScript = this.buildiTermTabScript(command, cwd, title);
        return ['-e', appleScript];
      }
    }
    
    // Fallback to regular args
    return this.getTerminalArgs(shell, shell, command, cwd);
  }

  /**
   * Builds AppleScript for Terminal.app execution with tabs using System Events
   */
  private buildTerminalWithTabsScript(commands: string[], cwd?: string): string {
    let script = 'tell application "Terminal"';
    script += '\n  activate';
    
    // Execute first command
    if (commands.length > 0) {
      script += '\n  do script';
      if (cwd) {
        script += ` "cd '${cwd}' && ${commands[0]}"`;
      } else {
        script += ` "${commands[0]}"`;
      }
    }
    
    // Create tabs for remaining commands
    for (let i = 1; i < commands.length; i++) {
      script += '\n  delay 0.5';
      script += '\n  tell application "System Events" to tell process "Terminal" to keystroke "t" using command down';
      script += '\n  delay 0.5';
      script += '\n  do script';
      if (cwd) {
        script += ` "cd '${cwd}' && ${commands[i]}"`;
      } else {
        script += ` "${commands[i]}"`;
      }
      script += ' in window 1';
    }
    
    script += '\nend tell';
    return script;
  }

  /**
   * Builds AppleScript for iTerm2 execution
   */
  private buildiTermScript(command: string, cwd?: string): string {
    let script = 'tell application "iTerm"';
    script += '\n  activate'; // Bring iTerm to foreground
    script += '\n  tell current window';
    script += '\n    create tab with default profile';
    
    if (cwd) {
      script += `\n    tell current session to write text "cd '${cwd}'"`;
    }
    
    script += `\n    tell current session to write text "${command}"`;
    script += '\n  end tell';
    script += '\nend tell';
    return script;
  }

  /**
   * Builds AppleScript for Terminal.app tab creation
   */
  private buildTerminalTabScript(command: string, cwd?: string, title?: string): string {
    let script = 'tell application "Terminal"';
    
    if (cwd) {
      script += `\n  do script "cd '${cwd}'"`;
    }
    
    script += `\n  do script "${command}"`;
    
    if (title) {
      script += `\n  set custom title of front tab to "${title}"`;
    }
    
    script += '\nend tell';
    return script;
  }

  /**
   * Builds AppleScript for iTerm2 tab creation
   */
  private buildiTermTabScript(command: string, cwd?: string, title?: string): string {
    let script = 'tell application "iTerm"';
    script += '\n  tell current window';
    script += '\n    create tab with default profile';
    
    if (cwd) {
      script += `\n    tell current session to write text "cd '${cwd}'"`;
    }
    
    script += `\n    tell current session to write text "${command}"`;
    
    if (title) {
      script += `\n    set name to "${title}"`;
    }
    
    script += '\n  end tell';
    script += '\nend tell';
    return script;
  }

  private async executeCommand(params: { command: string; timeout: number }): Promise<Result<{ success: boolean; stdout: string; stderr: string; exitCode: number }>> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', params.command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          ok: true,
          value: {
            success: code === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || 0
          }
        });
      });

      child.on('error', (error) => {
        resolve({
          ok: false,
          error: error
        });
      });

      // Set timeout
      setTimeout(() => {
        child.kill();
        resolve({
          ok: false,
          error: new Error(`Command timeout after ${params.timeout}ms`)
        });
      }, params.timeout);
    });
  }
}
