import { ITerminalHandler, TerminalArgsOptions } from './ITerminalHandler';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { Result } from '@codestate/core/domain/models/Result';

export class LinuxTerminalHandler implements ITerminalHandler {
  constructor(private logger: ILoggerService) {}

  async detectTerminal(): Promise<string> {
    // Common terminal emulators to try, in order of preference
    const terminals = [
      'gnome-terminal',
      'xterm',
      'konsole',
      'xfce4-terminal',
      'mate-terminal',
      'tilix',
      'terminator',
      'alacritty',
      'kitty'
    ];

    this.logger.debug('Detecting available Linux terminals', { terminals });

    for (const terminal of terminals) {
      try {
        const result = await this.executeCommand({ 
          command: `which ${terminal}`, 
          timeout: 2000 
        });
        if (result.ok && result.value.success) {
          this.logger.debug(`Linux terminal detected: ${terminal}`);
          return terminal;
        }
      } catch (error) {
        this.logger.debug(`Terminal ${terminal} not available`, { error });
        // Continue to next terminal
        continue;
      }
    }

    // Fallback to gnome-terminal if none detected (will fail gracefully)
    this.logger.warn('No common terminal emulator detected, falling back to gnome-terminal');
    return 'gnome-terminal';
  }

  getTerminalArgs(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    // Linux - handle different terminal emulators
    if (terminalCmd.includes('gnome-terminal')) {
      args.push('--', shell, '-c', command);
    } else if (terminalCmd.includes('xterm')) {
      args.push('-hold', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('konsole')) {
      args.push('--hold', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('xfce4-terminal')) {
      args.push('--execute', shell, '-c', command);
    } else if (terminalCmd.includes('mate-terminal')) {
      args.push('--execute', shell, '-c', command);
    } else if (terminalCmd.includes('tilix')) {
      args.push('--new-process', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('terminator')) {
      args.push('--new-tab', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('alacritty')) {
      args.push('-e', shell, '-c', command);
    } else if (terminalCmd.includes('kitty')) {
      args.push('--', shell, '-c', command);
    } else {
      // fallback to gnome-terminal style
      args.push('--', shell, '-c', command);
    }
    
    if (cwd && typeof cwd === 'string') {
      // Add working directory argument for terminals that support it
      if (terminalCmd.includes('gnome-terminal') || 
          terminalCmd.includes('xfce4-terminal') || 
          terminalCmd.includes('mate-terminal') ||
          terminalCmd.includes('tilix')) {
        args.unshift('--working-directory', cwd);
      } else if (terminalCmd.includes('xterm') || terminalCmd.includes('konsole')) {
        // xterm and konsole don't have working directory flags, use cd command
        const cdCommand = `cd "${cwd}" && ${command}`;
        args.splice(-1, 1, cdCommand); // Replace the last argument (command) with cdCommand
      }
    }
    
    return args;
  }

  getTerminalArgsForApp(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    // Linux - handle different terminal emulators without hold flags
    if (terminalCmd.includes('gnome-terminal')) {
      args.push('--', shell, '-c', command);
    } else if (terminalCmd.includes('xterm')) {
      // Use -e without -hold to allow terminal to close
      args.push('-e', shell, '-c', command);
    } else if (terminalCmd.includes('konsole')) {
      // Use -e without --hold to allow terminal to close
      args.push('-e', shell, '-c', command);
    } else if (terminalCmd.includes('xfce4-terminal')) {
      args.push('--execute', shell, '-c', command);
    } else if (terminalCmd.includes('mate-terminal')) {
      args.push('--execute', shell, '-c', command);
    } else if (terminalCmd.includes('tilix')) {
      args.push('--new-process', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('terminator')) {
      args.push('--new-tab', '-e', shell, '-c', command);
    } else if (terminalCmd.includes('alacritty')) {
      args.push('-e', shell, '-c', command);
    } else if (terminalCmd.includes('kitty')) {
      args.push('--', shell, '-c', command);
    } else {
      // fallback to gnome-terminal style
      args.push('--', shell, '-c', command);
    }
    
    if (cwd && typeof cwd === 'string') {
      // Add working directory argument for terminals that support it
      if (terminalCmd.includes('gnome-terminal') || 
          terminalCmd.includes('xfce4-terminal') || 
          terminalCmd.includes('mate-terminal') ||
          terminalCmd.includes('tilix')) {
        args.unshift('--working-directory', cwd);
      } else if (terminalCmd.includes('xterm') || terminalCmd.includes('konsole')) {
        // xterm and konsole don't have working directory flags, use cd command
        const cdCommand = `cd "${cwd}" && ${command}`;
        args.splice(-1, 1, cdCommand); // Replace the last argument (command) with cdCommand
      }
    }
    
    return args;
  }

  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await this.executeCommand({ 
        command: `which ${command}`, 
        timeout: 2000 
      });
      return result.ok && result.value.success;
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
    
    if (useTabs) {
      if (shell.includes('gnome-terminal')) {
        // GNOME Terminal with tab support
        const args = ['--tab'];
        if (title) {
          args.push('--title', title);
        }
        args.push('--', 'bash', '-c', command);
        return args;
      } else if (shell.includes('konsole')) {
        // Konsole with tab support
        const args = ['--new-tab'];
        if (title) {
          args.push('--title', title);
        }
        args.push('-e', 'bash', '-c', command);
        return args;
      } else if (shell.includes('xfce4-terminal')) {
        // XFCE Terminal with tab support
        const args = ['--tab'];
        if (title) {
          args.push('--title', title);
        }
        args.push('--execute', 'bash', '-c', command);
        return args;
      } else if (shell.includes('mate-terminal')) {
        // MATE Terminal with tab support
        const args = ['--tab'];
        if (title) {
          args.push('--title', title);
        }
        args.push('--execute', 'bash', '-c', command);
        return args;
      } else if (shell.includes('terminator')) {
        // Terminator already supports tabs
        const args = ['--new-tab'];
        if (title) {
          args.push('--title', title);
        }
        args.push('-e', 'bash', '-c', command);
        return args;
      }
    }
    
    // Fallback to regular args
    return this.getTerminalArgs(shell, shell, command, cwd);
  }

  /**
   * Get list of terminals that support tabs
   */
  getTabSupportedTerminals(): string[] {
    return [
      'gnome-terminal',
      'konsole', 
      'xfce4-terminal',
      'mate-terminal',
      'terminator'
    ];
  }

  /**
   * Check if a specific terminal supports tabs
   */
  supportsTabs(terminalCmd: string): boolean {
    return this.getTabSupportedTerminals().some(terminal => terminalCmd.includes(terminal));
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
