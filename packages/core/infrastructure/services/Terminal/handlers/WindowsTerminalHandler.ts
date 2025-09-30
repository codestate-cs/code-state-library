import { ITerminalHandler, TerminalArgsOptions } from './ITerminalHandler';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { Result } from '@codestate/core/domain/models/Result';

export class WindowsTerminalHandler implements ITerminalHandler {
  constructor(private logger: ILoggerService) {}

  async detectTerminal(): Promise<string> {
    // Common Windows terminal emulators to try, in order of preference
    const terminals = [
      'wt.exe',           // Windows Terminal (modern)
      'powershell.exe',   // PowerShell
      'wsl.exe',          // Windows Subsystem for Linux
      'bash.exe',         // Git Bash
      'mintty.exe',       // MinTTY
      'cmd.exe'           // Fallback to Command Prompt
    ];

    this.logger.debug('Detecting available Windows terminals', { terminals });

    for (const terminal of terminals) {
      try {
        // On Windows, use 'where' instead of 'which'
        const result = await this.executeCommand({ 
          command: `where ${terminal}`, 
          timeout: 2000 
        });
        if (result.ok && result.value.success) {
          this.logger.debug(`Windows terminal detected: ${terminal}`);
          return terminal;
        }
      } catch (error) {
        this.logger.debug(`Windows terminal ${terminal} not available`, { error });
        // Continue to next terminal
        continue;
      }
    }

    // Fallback to cmd.exe if none detected (will fail gracefully)
    this.logger.warn('No common Windows terminal emulator detected, falling back to cmd.exe');
    return 'cmd.exe';
  }

  getTerminalArgs(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'wt.exe') {
      // Windows Terminal (modern) - supports tabs
      args.push('new-tab', '--title', 'CodeState Script', '--', 'cmd', '/k', command);
    } else if (terminalCmd === 'cmd.exe') {
      // Windows Command Prompt
      args.push('/c', 'start', 'cmd', '/k', command);
    } else if (terminalCmd === 'powershell.exe') {
      // Windows PowerShell
      args.push('-Command', 'Start-Process', 'powershell', '-ArgumentList', '-NoExit', '-Command', command);
    } else if (terminalCmd === 'wsl.exe') {
      // Windows Subsystem for Linux
      args.push('-e', 'bash', '-c', command);
    } else if (terminalCmd === 'bash.exe') {
      // Git Bash
      args.push('-c', command);
    } else if (terminalCmd === 'mintty.exe') {
      // MinTTY (Git Bash)
      args.push('-e', 'bash', '-c', command);
    }
    
    return args;
  }

  getTerminalArgsForApp(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'cmd.exe') {
      // Windows - use /c to execute and close
      args.push('/c', command);
    } else if (terminalCmd === 'powershell.exe') {
      // PowerShell - execute and close
      args.push('-Command', command);
    } else if (terminalCmd === 'wsl.exe') {
      // WSL - execute and close
      args.push('-e', 'bash', '-c', command);
    } else if (terminalCmd === 'bash.exe') {
      // Git Bash - execute and close
      args.push('-c', command);
    } else if (terminalCmd === 'mintty.exe') {
      // MinTTY - execute and close
      args.push('-e', 'bash', '-c', command);
    } else if (terminalCmd === 'wt.exe') {
      // Windows Terminal - execute and close
      args.push('--', 'cmd', '/c', command);
    }
    
    return args;
  }

  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      // On Windows, check if the command is a full path to an executable
      if (command.includes('\\') && command.endsWith('.exe')) {
        // It's a full path, check if file exists
        const fs = await import('fs');
        const exists = fs.existsSync(command);
        return exists;
      } else {
        // Try to find it in PATH using PowerShell's Get-Command
        const result = await this.executeCommand({ 
          command: `powershell -Command "Get-Command '${command}' -ErrorAction SilentlyContinue"`, 
          timeout: 5000 
        });
        return result.ok && result.value.success;
      }
    } catch (error) {
      this.logger.debug(`Command availability check failed for ${command}`, { error });
      return false;
    }
  }

  /**
   * Enhanced method to get terminal args with tab support
   */
  getTerminalArgsWithTabs(options: TerminalArgsOptions): string[] {
    const { shell, command, cwd, title, useTabs } = options;
    
    if (useTabs && shell === 'wt.exe') {
      // Windows Terminal with tab support
      const args = ['new-tab'];
      if (title) {
        args.push('--title', title);
      }
      args.push('--', 'cmd', '/k', command);
      return args;
    }
    
    // Fallback to regular args
    return this.getTerminalArgs(shell, shell, command, cwd);
  }

  private async executeCommand(params: { command: string; timeout: number }): Promise<Result<{ success: boolean; stdout: string; stderr: string; exitCode: number }>> {
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    
    return new Promise((resolve) => {
      const child = spawn('cmd', ['/c', params.command], {
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
