import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { TerminalCommand, TerminalResult, TerminalOptions } from '@codestate/core/domain/models/Terminal';
import { TerminalCommandState } from '@codestate/core/domain/models/Session';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { TerminalError, ErrorCode } from '@codestate/core/domain/types/ErrorTypes';
import { spawn, SpawnOptions } from 'child_process';
import { platform } from 'os';
import * as path from 'path';

export class TerminalService implements ITerminalService {
  constructor(private logger: ILoggerService) {}

  async execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>> {
    this.logger.debug('TerminalService.execute called', { command, options });
    
    const terminalCommand: TerminalCommand = {
      command,
      ...options
    };
    
    return this.executeCommand(terminalCommand);
  }

  async executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>> {
    this.logger.debug('TerminalService.executeCommand called', { command });
    
    const startTime = Date.now();
    
    try {
      // Validate command
      if (!command.command || command.command.trim().length === 0) {
        return { ok: false, error: new TerminalError('Command cannot be empty', ErrorCode.TERMINAL_COMMAND_FAILED) };
      }

      // Remove the isCommandAvailable check to prevent circular dependency
      // const isAvailable = await this.isCommandAvailable(command.command.split(' ')[0]);
      // if (!isAvailable.ok || !isAvailable.value) {
      //   this.logger.warn('Command may not be available', { command: command.command });
      // }

      // Prepare spawn options
      const spawnOptions: SpawnOptions = {
        cwd: command.cwd || process.cwd(),
        env: { ...process.env, ...command.env },
        shell: this.getDefaultShell(),
        timeout: command.timeout || 30000, // 30 seconds default
      };

      // Parse command and arguments
      const [cmd, args] = this.parseCommand(command.command);

      // Execute command
      const result = await this.spawnCommand(cmd, args, spawnOptions);
      const duration = Date.now() - startTime;

      const terminalResult: TerminalResult = {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration,
      };

      this.logger.log('Command executed', { 
        command: command.command, 
        exitCode: result.exitCode, 
        duration,
        success: terminalResult.success 
      });

      return { ok: true, value: terminalResult };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Command execution failed', { command: command.command, error, duration });
      
      return { 
        ok: false, 
        error: new TerminalError(
          `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>> {
    this.logger.debug('TerminalService.executeBatch called', { count: commands.length });
    
    const results: TerminalResult[] = [];
    
    for (const command of commands) {
      const result = await this.executeCommand(command);
      if (isFailure(result)) {
        this.logger.error('Batch execution failed', { command: command.command, error: (result as any).error });
        return { ok: false, error: (result as any).error };
      }
      results.push(result.value);
    }
    
    this.logger.log('Batch execution completed', { count: results.length });
    return { ok: true, value: results };
  }

  async spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnTerminal called', { command, options });
    
    const terminalCommand: TerminalCommand = {
      command,
      ...options
    };
    
    return this.spawnTerminalCommand(terminalCommand);
  }

  async spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnTerminalCommand called', { command });
    
    try {
      // Validate command
      if (!command.command || command.command.trim().length === 0) {
        return { ok: false, error: new TerminalError('Command cannot be empty', ErrorCode.TERMINAL_COMMAND_FAILED) };
      }

      // Get the appropriate terminal command for the current platform
      const terminalCmd = this.getTerminalCommand();
      const shell = this.getDefaultShell();
      
      // Prepare spawn options
      const spawnOptions: SpawnOptions = {
        cwd: command.cwd || process.cwd(),
        env: { ...process.env, ...command.env },
        detached: true, // Important: run in detached mode so it opens in a new window
        stdio: 'ignore', // Ignore stdio to prevent hanging
      };

      // Parse the command to execute
      const [cmd, args] = this.parseCommand(command.command);
      
      // Create the full command string for the terminal
      let fullCommand = `${cmd} ${args.join(' ')}`;
      
      // For Linux, modify the command to ensure terminal stays open
      const osPlatform = platform();
      if (osPlatform === 'linux') {
        if (terminalCmd.includes('gnome-terminal')) {
          fullCommand = `${shell} -c "${fullCommand}; exec ${shell}"`;
        } else if (terminalCmd.includes('xterm')) {
          // xterm will use -hold flag in getTerminalArgs
        } else if (terminalCmd.includes('konsole')) {
          // konsole will use --hold flag in getTerminalArgs
        } else {
          // fallback: force bash read trick
          fullCommand = `${shell} -c "${fullCommand}; echo 'Press Enter to close terminal...'; read"`;
        }
      }
      
      // Spawn the terminal with the command
      const terminalArgs = this.getTerminalArgs(terminalCmd, shell, fullCommand, command.cwd);
      
      const child = spawn(terminalCmd, terminalArgs, spawnOptions);
      
      // Don't wait for the process to complete since it's a new terminal window
      child.unref();
      
      this.logger.log('Terminal spawned successfully', { 
        command: command.command, 
        terminalCmd,
        terminalArgs 
      });
      
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to spawn terminal', { command: command.command, error });
      
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to spawn terminal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async spawnApplication(command: string, options?: SpawnOptions): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnApplication called', { command });
    
    try {
      // Validate command
      if (!command || command.trim().length === 0) {
        return { ok: false, error: new TerminalError('Command cannot be empty', ErrorCode.TERMINAL_COMMAND_FAILED) };
      }

      // Get the appropriate terminal command for the current platform
      const terminalCmd = this.getTerminalCommand();
      const shell = this.getDefaultShell();
      
      // Prepare spawn options
      const spawnOptions: SpawnOptions = {
        cwd: options?.cwd || process.cwd(),
        env: { ...process.env, ...options?.env },
        detached: true, // Important: run in detached mode so it opens in a new window
        stdio: 'ignore', // Ignore stdio to prevent hanging
      };

      // Parse the command to execute
      const [cmd, args] = this.parseCommand(command);
      
      // Create the full command string for the terminal
      let fullCommand = `${cmd} ${args.join(' ')}`;
      
      // For Linux, modify the command to ensure terminal closes after launching the app
      const osPlatform = platform();
      if (osPlatform === 'linux') {
        if (terminalCmd.includes('gnome-terminal')) {
          // For gnome-terminal, use -- bash -c "command && exit" to close after execution
          fullCommand = `${shell} -c "${fullCommand} && exit"`;
        } else if (terminalCmd.includes('xterm')) {
          // xterm will use -e flag without -hold
          fullCommand = `${shell} -c "${fullCommand} && exit"`;
        } else if (terminalCmd.includes('konsole')) {
          // konsole will use -e flag without --hold
          fullCommand = `${shell} -c "${fullCommand} && exit"`;
        } else {
          // fallback: force exit after command
          fullCommand = `${shell} -c "${fullCommand} && exit"`;
        }
      }
      
      // Spawn the terminal with the command
      const cwd = options?.cwd && typeof options.cwd === 'string' ? options.cwd : undefined;
      const terminalArgs = this.getTerminalArgsForApp(terminalCmd, shell, fullCommand, cwd);
      
      const child = spawn(terminalCmd, terminalArgs, spawnOptions);
      
      // Don't wait for the process to complete since it's a new terminal window
      child.unref();
      
      this.logger.log('Application launched successfully', { 
        command: command, 
        terminalCmd,
        terminalArgs 
      });
      
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to launch application', { command: command, error });
      
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to launch application: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async isCommandAvailable(command: string): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.isCommandAvailable called', { command });
    
    try {
      const osPlatform = platform();
      
      if (osPlatform === 'win32') {
        // On Windows, check if the command is a full path to an executable
        if (command.includes('\\') && command.endsWith('.exe')) {
          // It's a full path, check if file exists
          const fs = await import('fs');
          const exists = fs.existsSync(command);
          return { ok: true, value: exists };
        } else {
          // Try to find it in PATH using PowerShell's Get-Command
          const result = await this.executeCommand({ 
            command: `powershell -Command "Get-Command '${command}' -ErrorAction SilentlyContinue"`, 
            timeout: 5000 
          });
          return { ok: true, value: result.ok && result.value.success && result.value.stdout.trim() !== '' };
        }
      } else {
        // On Unix-like systems, use 'which' command
        const result = await this.executeCommand({ 
          command: `which ${command}`, 
          timeout: 5000 
        });
        return { ok: true, value: result.ok && result.value.success };
      }
    } catch (error) {
      this.logger.debug('Command availability check failed', { command, error });
      return { ok: true, value: false };
    }
  }

  async getShell(): Promise<Result<string>> {
    this.logger.debug('TerminalService.getShell called');
    
    try {
      const shell = this.getDefaultShell();
      this.logger.log('Shell detected', { shell });
      return { ok: true, value: shell };
    } catch (error) {
      this.logger.error('Failed to get shell', { error });
      return { ok: false, error: new TerminalError('Failed to get shell', ErrorCode.TERMINAL_COMMAND_FAILED) };
    }
  }

  async getLastCommandsFromTerminals(): Promise<Result<TerminalCommandState[]>> {
    this.logger.debug('TerminalService.getLastCommandsFromTerminals called');
    
    try {
      const osPlatform = platform();
      const currentCwd = process.cwd();
      const terminalCommands: TerminalCommandState[] = [];
      
      if (osPlatform === 'win32') {
        // Windows: Use tasklist to find cmd.exe processes and get their command lines
        const result = await this.execute('tasklist /v /fo csv /nh');
        if (result.ok) {
          const lines = result.value.stdout.split('\n');
          let terminalId = 1;
          
          for (const line of lines) {
            if (line.includes('cmd.exe') && line.includes(currentCwd)) {
              // Extract command from tasklist output
              const commandMatch = line.match(/"([^"]+)"/g);
              if (commandMatch && commandMatch.length > 1) {
                const command = commandMatch[1].replace(/"/g, '');
                if (command && command !== 'cmd.exe') {
                  terminalCommands.push({
                    terminalId: terminalId++,
                    terminalName: `cmd-${terminalId}`,
                    commands: [{
                      command: command,
                      name: `Command ${terminalId}`,
                      priority: 1
                    }]
                  });
                }
              }
            }
          }
        }
      } else {
        // Unix-like systems: Use ps to find terminal processes
        const result = await this.execute('ps -eo pid,ppid,cmd --no-headers');
        if (result.ok) {
          const lines = result.value.stdout.split('\n');
          let terminalId = 1;
          
          for (const line of lines) {
            // Look for terminal processes (bash, zsh, etc.) in current directory
            if ((line.includes('/bin/bash') || line.includes('/bin/zsh') || line.includes('terminal')) && 
                line.includes(currentCwd)) {
              // Extract the actual command being run
              const parts = line.trim().split(/\s+/);
              if (parts.length >= 3) {
                const command = parts.slice(2).join(' '); // Skip pid and ppid
                if (command && !command.includes('ps -eo')) {
                  terminalCommands.push({
                    terminalId: terminalId++,
                    terminalName: `terminal-${terminalId}`,
                    commands: [{
                      command: command,
                      name: `Command ${terminalId}`,
                      priority: 1
                    }]
                  });
                }
              }
            }
          }
        }
      }
      
      this.logger.log('Captured terminal commands', { 
        count: terminalCommands.length,
        commands: terminalCommands.map(t => ({ 
          id: t.terminalId, 
          name: t.terminalName,
          commandCount: t.commands.length 
        }))
      });
      
      return { ok: true, value: terminalCommands };
    } catch (error) {
      this.logger.error('Failed to capture terminal commands', { error });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to capture terminal commands: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        )
      };
    }
  }

  private getDefaultShell(): string {
    const osPlatform = platform();
    
    switch (osPlatform) {
      case 'win32':
        return process.env.COMSPEC || 'cmd.exe';
      case 'darwin':
        return process.env.SHELL || '/bin/zsh';
      default: // linux, freebsd, etc.
        return process.env.SHELL || '/bin/bash';
    }
  }

  private getTerminalCommand(): string {
    const osPlatform = platform();
    if (osPlatform === 'win32') {
      return 'cmd.exe';
    } else if (osPlatform === 'darwin') {
      return 'open';
    } else {
      // Linux - try common terminal emulators
      return 'gnome-terminal';
    }
  }

  private getTerminalArgs(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'cmd.exe') {
      // Windows
      args.push('/c', 'start', 'cmd', '/k', command);
    } else if (terminalCmd === 'open') {
      // macOS
      args.push('-a', 'Terminal', command);
    } else {
      // Linux - handle different terminal emulators
      if (terminalCmd.includes('gnome-terminal')) {
        args.push('--', shell, '-c', command);
      } else if (terminalCmd.includes('xterm')) {
        args.push('-hold', '-e', shell, '-c', command);
      } else if (terminalCmd.includes('konsole')) {
        args.push('--hold', '-e', shell, '-c', command);
      } else {
        // fallback to gnome-terminal style
        args.push('--', shell, '-c', command);
      }
      
      if (cwd && typeof cwd === 'string') {
        args.unshift('--working-directory', cwd);
      }
    }
    
    return args;
  }

  private getTerminalArgsForApp(terminalCmd: string, shell: string, command: string, cwd?: string): string[] {
    const args: string[] = [];
    
    if (terminalCmd === 'cmd.exe') {
      // Windows - use /c to execute and close
      args.push('/c', command);
    } else if (terminalCmd === 'open') {
      // macOS
      args.push('-a', 'Terminal', command);
    } else {
      // Linux - handle different terminal emulators without hold flags
      if (terminalCmd.includes('gnome-terminal')) {
        args.push('--', shell, '-c', command);
      } else if (terminalCmd.includes('xterm')) {
        // Use -e without -hold to allow terminal to close
        args.push('-e', shell, '-c', command);
      } else if (terminalCmd.includes('konsole')) {
        // Use -e without --hold to allow terminal to close
        args.push('-e', shell, '-c', command);
      } else {
        // fallback to gnome-terminal style
        args.push('--', shell, '-c', command);
      }
      
      if (cwd && typeof cwd === 'string') {
        args.unshift('--working-directory', cwd);
      }
    }
    
    return args;
  }

  private parseCommand(commandString: string): [string, string[]] {
    // Simple command parsing - split by spaces, handle quotes
    const parts = commandString.match(/(?:[^\s"']+|"[^"]*"|'[^']*')/g) || [];
    const cmd = parts[0] || '';
    const args = parts.slice(1).map(arg => {
      // Remove quotes if present
      if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
        return arg.slice(1, -1);
      }
      return arg;
    });
    
    return [cmd, args];
  }

  private spawnCommand(command: string, args: string[], options: SpawnOptions): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, options);
      
      let stdout = '';
      let stderr = '';
      
      // Set up timeout
      const timeout = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new TerminalError('Command timed out', ErrorCode.TERMINAL_TIMEOUT));
      }, options.timeout || 30000);
      
      // Collect stdout
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Collect stderr
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Handle process completion
      process.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      // Handle process errors
      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new TerminalError(`Process error: ${error.message}`, ErrorCode.TERMINAL_COMMAND_FAILED));
      });
      
      // Handle process exit with signal
      process.on('exit', (code, signal) => {
        clearTimeout(timeout);
        if (signal) {
          reject(new TerminalError(`Process killed by signal: ${signal}`, ErrorCode.TERMINAL_COMMAND_FAILED));
        } else {
          resolve({
            exitCode: code || 0,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
        }
      });
    });
  }
} 