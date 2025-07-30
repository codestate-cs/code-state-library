import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { TerminalCommand, TerminalResult, TerminalOptions } from '@codestate/core/domain/models/Terminal';
import { Result } from '@codestate/core/domain/models/Result';
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
      if (!result.ok) {
        this.logger.error('Batch execution failed', { command: command.command, error: result.error });
        return result;
      }
      results.push(result.value);
    }
    
    this.logger.log('Batch execution completed', { count: results.length });
    return { ok: true, value: results };
  }

  async isCommandAvailable(command: string): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.isCommandAvailable called', { command });
    
    try {
      const result = await this.executeCommand({ 
        command: `which ${command}`, 
        timeout: 5000 
      });
      return { ok: true, value: result.ok && result.value.success };
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