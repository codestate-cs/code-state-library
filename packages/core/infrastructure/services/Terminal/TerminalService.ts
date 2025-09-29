import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { TerminalCommand, TerminalResult, TerminalOptions } from '@codestate/core/domain/models/Terminal';
import { TerminalCommandState } from '@codestate/core/domain/models/Session';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { TerminalError, ErrorCode } from '@codestate/core/domain/types/ErrorTypes';
import { spawn, SpawnOptions } from 'child_process';
import { platform } from 'os';
import * as path from 'path';

// Import OS-specific handlers
import { ITerminalHandler } from './handlers/ITerminalHandler';
import { WindowsTerminalHandler } from './handlers/WindowsTerminalHandler';
import { MacOSTerminalHandler } from './handlers/MacOSTerminalHandler';
import { LinuxTerminalHandler } from './handlers/LinuxTerminalHandler';

export class TerminalService implements ITerminalService {
  private terminalHandler: ITerminalHandler;

  constructor(private logger: ILoggerService) {
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
    
    // Store the original working directory
    let originalCwd: string = process.cwd();
    
    try {
      // Validate command
      if (!command.command || command.command.trim().length === 0) {
        return { ok: false, error: new TerminalError('Command cannot be empty', ErrorCode.TERMINAL_COMMAND_FAILED) };
      }

      // Store the original working directory
      originalCwd = process.cwd();
      
      // Change to the target directory if specified
      if (command.cwd && typeof command.cwd === 'string') {
        try {
          process.chdir(command.cwd);
          this.logger.debug('Changed working directory', { from: originalCwd, to: command.cwd });
        } catch (error) {
          this.logger.error('Failed to change working directory', { cwd: command.cwd, error });
          return { 
            ok: false, 
            error: new TerminalError(
              `Failed to change working directory to ${command.cwd}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              ErrorCode.TERMINAL_COMMAND_FAILED
            ) 
          };
        }
      }

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

      // Restore original working directory
      if (command.cwd && typeof command.cwd === 'string') {
        try {
          process.chdir(originalCwd);
          this.logger.debug('Restored working directory', { to: originalCwd });
        } catch (error) {
          this.logger.warn('Failed to restore working directory', { cwd: originalCwd, error });
        }
      }

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
      
      // Restore original working directory on error
      if (command.cwd && typeof command.cwd === 'string') {
        try {
          process.chdir(originalCwd);
        } catch (restoreError) {
          this.logger.warn('Failed to restore working directory on error', { cwd: originalCwd, error: restoreError });
        }
      }

      this.logger.error('Command execution failed', { 
        command: command.command, 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });

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
    this.logger.debug('TerminalService.executeBatch called', { commandCount: commands.length });
    
    const results: TerminalResult[] = [];
    
    for (const command of commands) {
      const result = await this.executeCommand(command);
      
      if (isFailure(result)) {
        this.logger.error('Batch execution failed', { error: result.error, command: command.command });
        return { ok: false, error: result.error };
      }
      
      results.push(result.value);
    }
    
    this.logger.log('Batch execution completed', { 
      totalCommands: commands.length, 
      successfulCommands: results.filter(r => r.success).length 
    });
    
    return { ok: true, value: results };
  }

  async spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnTerminal called', { command, options });
    
    try {
      // Detect the best terminal for the current OS
      const terminalCmd = await this.terminalHandler.detectTerminal();
      this.logger.debug('Detected terminal', { terminalCmd });
      
      // Get shell
      const shellResult = await this.getShell();
      if (isFailure(shellResult)) {
        return { ok: false, error: shellResult.error };
      }
      const shell = shellResult.value;
      
      // Get terminal arguments
      const args = this.terminalHandler.getTerminalArgs(terminalCmd, shell, command, options?.cwd);
      
      this.logger.debug('Spawning terminal', { terminalCmd, args });
      
      // Spawn the terminal process
      this.logger.debug('About to spawn terminal process', { 
        terminalCmd, 
        args, 
        spawnOptions: { detached: true, stdio: 'ignore' } 
      });
      
      const child = spawn(terminalCmd, args, {
        detached: true,
        stdio: 'ignore'
      });
      
      this.logger.debug('Spawn process created', { 
        pid: child.pid, 
        terminalCmd, 
        args 
      });
      
      child.unref();
      
      this.logger.log('Terminal spawned successfully', { terminalCmd, command });
      return { ok: true, value: true };
      
    } catch (error) {
      this.logger.error('Failed to spawn terminal', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to spawn terminal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async spawnTerminalWithTabs(command: string, options?: TerminalOptions & { title?: string; useTabs?: boolean; tabCommands?: string[] }): Promise<Result<boolean>> {
    try {
      this.logger.debug('Spawning terminal with tabs', { command, options });
      
      if (!options?.useTabs) {
        this.logger.debug('Tab mode not requested, using regular spawning');
        return this.spawnTerminal(command, options);
      }

      // Detect the best terminal for the current OS
      const terminalCmd = await this.terminalHandler.detectTerminal();
      this.logger.debug('Detected terminal for tab spawning', { terminalCmd });
      
      // For macOS, use System Events approach for tabs
      if (terminalCmd === 'osascript') {
        this.logger.debug('Using System Events approach for macOS tabs');
        
        // Use provided tab commands if available, otherwise extract from combined command
        let tabCommands: string[];
        if (options?.tabCommands && options.tabCommands.length > 0) {
          tabCommands = options.tabCommands;
          this.logger.debug('Using provided tab commands', { commandCount: tabCommands.length, commands: tabCommands });
        } else {
          tabCommands = this.extractTabCommands(command);
          this.logger.debug('Extracted tab commands', { commandCount: tabCommands.length, commands: tabCommands });
        }
        
        if (tabCommands.length <= 1) {
          this.logger.debug('Single command, using regular spawning');
          return this.spawnTerminal(command, options);
        }
        
        // Build AppleScript with System Events for tabs
        let appleScript = 'tell application "Terminal"\n  activate\n';
        
        // Execute first command
        appleScript += '  do script';
        if (options?.cwd) {
          appleScript += ` "cd '${options.cwd}' && ${tabCommands[0].replace(/"/g, '\\"')}"`;
        } else {
          appleScript += ` "${tabCommands[0].replace(/"/g, '\\"')}"`;
        }
        appleScript += '\n';
        
        // Create tabs for remaining commands using System Events
        for (let i = 1; i < tabCommands.length; i++) {
          appleScript += '  delay 0.5\n';
          appleScript += '  tell application "System Events" to tell process "Terminal" to keystroke "t" using command down\n';
          appleScript += '  delay 0.5\n';
          appleScript += '  do script';
          if (options?.cwd) {
            appleScript += ` "cd '${options.cwd}' && ${tabCommands[i].replace(/"/g, '\\"')}"`;
          } else {
            appleScript += ` "${tabCommands[i].replace(/"/g, '\\"')}"`;
          }
          appleScript += ' in window 1\n';
        }
        
        appleScript += 'end tell';
        
        this.logger.log('🍎 SYSTEM EVENTS APPLESCRIPT:', { 
          appleScript, 
          commandCount: tabCommands.length,
          formattedScript: appleScript.replace(/\n/g, '\\n')
        });
        
        // Execute the AppleScript
        const args = ['-e', appleScript];
        this.logger.debug('Executing System Events AppleScript', { terminalCmd, args });
        
        const child = spawn(terminalCmd, args, {
          detached: false,
          stdio: 'pipe'
        });
        
        // Log any errors from the spawn process
        child.stderr?.on('data', (data) => {
          this.logger.error('AppleScript stderr', { data: data.toString() });
        });
        
        child.stdout?.on('data', (data) => {
          this.logger.debug('AppleScript stdout', { data: data.toString() });
        });
        
        child.on('error', (error) => {
          this.logger.error('AppleScript spawn error', { error: error.message });
        });
        
        child.on('close', (code) => {
          this.logger.debug('AppleScript process closed', { code });
        });
        
        child.unref();
        
        this.logger.log('Terminal with tabs spawned successfully using System Events', { 
          terminalCmd, 
          command, 
          tabCount: tabCommands.length 
        });
        return { ok: true, value: true };
      } else {
        // For Linux and other platforms, implement tab support
        this.logger.debug('Using Linux/other platform tab approach');
        
        // Use provided tab commands if available, otherwise extract from combined command
        let tabCommands: string[];
        if (options?.tabCommands && options.tabCommands.length > 0) {
          tabCommands = options.tabCommands;
          this.logger.debug('Using provided tab commands', { commandCount: tabCommands.length, commands: tabCommands });
        } else {
          tabCommands = this.extractTabCommands(command);
          this.logger.debug('Extracted tab commands', { commandCount: tabCommands.length, commands: tabCommands });
        }
        
        if (tabCommands.length <= 1) {
          this.logger.debug('Single command, using regular spawning');
          return this.spawnTerminal(command, options);
        }
        
        // Check if terminal supports tabs
        const linuxHandler = this.terminalHandler as any;
        if (linuxHandler.supportsTabs && linuxHandler.supportsTabs(terminalCmd)) {
          this.logger.debug('Terminal supports tabs, creating tabs', { terminalCmd });
          return this.spawnLinuxTerminalWithTabs(terminalCmd, tabCommands, options);
        } else {
          this.logger.warn('Terminal does not support tabs, falling back to sequential execution', { terminalCmd });
          return this.spawnTerminal(command, options);
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to spawn terminal with tabs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to spawn terminal with tabs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        )
      };
    }
  }

  private async spawnLinuxTerminalWithTabs(
    terminalCmd: string, 
    tabCommands: string[], 
    options?: TerminalOptions & { title?: string; useTabs?: boolean; tabCommands?: string[] }
  ): Promise<Result<boolean>> {
    try {
      this.logger.debug('Spawning Linux terminal with tabs', { terminalCmd, tabCommands });
      
      // Get shell
      const shellResult = await this.getShell();
      if (isFailure(shellResult)) {
        return { ok: false, error: shellResult.error };
      }
      const shell = shellResult.value;
      
      // Create the first tab with the first command
      const firstCommand = tabCommands[0];
      const firstArgs = this.terminalHandler.getTerminalArgs(terminalCmd, shell, firstCommand, options?.cwd);
      
      this.logger.debug('Spawning first tab', { terminalCmd, firstArgs });
      
      // Spawn the first terminal window
      const firstChild = spawn(terminalCmd, firstArgs, {
        detached: true,
        stdio: 'ignore'
      });
      
      firstChild.unref();
      
      // Wait a bit for the first terminal to open
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create additional tabs for remaining commands
      for (let i = 1; i < tabCommands.length; i++) {
        const command = tabCommands[i];
        
        // Use terminal-specific tab creation commands
        let tabArgs: string[];
        if (terminalCmd.includes('gnome-terminal')) {
          tabArgs = ['--tab', '--', shell, '-c', command];
        } else if (terminalCmd.includes('konsole')) {
          tabArgs = ['--new-tab', '-e', shell, '-c', command];
        } else if (terminalCmd.includes('xfce4-terminal')) {
          tabArgs = ['--tab', '--execute', shell, '-c', command];
        } else if (terminalCmd.includes('mate-terminal')) {
          tabArgs = ['--tab', '--execute', shell, '-c', command];
        } else if (terminalCmd.includes('terminator')) {
          tabArgs = ['--new-tab', '-e', shell, '-c', command];
        } else {
          // Fallback: spawn new terminal window
          tabArgs = this.terminalHandler.getTerminalArgs(terminalCmd, shell, command, options?.cwd);
        }
        
        // Add working directory if supported
        if (options?.cwd && (terminalCmd.includes('gnome-terminal') || terminalCmd.includes('xfce4-terminal') || terminalCmd.includes('mate-terminal'))) {
          tabArgs.unshift('--working-directory', options.cwd);
        }
        
        this.logger.debug(`Spawning tab ${i + 1}`, { terminalCmd, tabArgs });
        
        const tabChild = spawn(terminalCmd, tabArgs, {
          detached: true,
          stdio: 'ignore'
        });
        
        tabChild.unref();
        
        // Small delay between tab creation
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.logger.log('Linux terminal with tabs spawned successfully', { 
        terminalCmd, 
        tabCount: tabCommands.length 
      });
      
      return { ok: true, value: true };
      
    } catch (error) {
      this.logger.error('Failed to spawn Linux terminal with tabs', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to spawn Linux terminal with tabs: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        )
      };
    }
  }

  private extractTabCommands(combinedCommand: string): string[] {
    // Split by the pattern that separates tab commands
    // Look for: && echo "🚀 Starting script X/Y:" (this indicates start of new tab)
    const tabSeparator = / && echo "🚀 Starting script \d+\/\d+:/;
    const commands = combinedCommand.split(tabSeparator);
    
    // The first command might not have the echo prefix, so we need to handle it
    const result: string[] = [];
    
    for (let i = 0; i < commands.length; i++) {
      let cmd = commands[i].trim();
      
      // Remove leading && if present
      if (cmd.startsWith('&& ')) {
        cmd = cmd.substring(3);
      }
      
      // For the first command, keep it as is (it already has the echo prefix)
      // For subsequent commands, add back the echo prefix
      if (i > 0) {
        // Extract the script name from the original command
        const scriptNameMatch = cmd.match(/^echo "🚀 Starting script \d+\/\d+: ([^"]+)"/);
        if (scriptNameMatch) {
          const scriptName = scriptNameMatch[1];
          cmd = `echo "🚀 Starting script ${i + 1}/${commands.length}:" && ${cmd.replace(/^echo "🚀 Starting script \d+\/\d+: [^"]+" && /, '')}`;
        } else {
          cmd = `echo "🚀 Starting script ${i + 1}/${commands.length}:" && ${cmd}`;
        }
      }
      
      if (cmd.length > 0) {
        result.push(cmd);
      }
    }
    
    return result;
  }

  async spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnTerminalCommand called', { command });
    
    // Use different spawning method based on closeAfterExecution flag
    if (command.closeAfterExecution === false) {
      // Use regular terminal spawning (keeps terminal open)
      return this.spawnTerminal(command.command, {
        cwd: command.cwd,
        env: command.env,
        timeout: command.timeout
      });
    } else {
      // Use application spawning (allows terminal to close)
      return this.spawnApplication(command.command, {
        cwd: command.cwd,
        env: command.env,
        timeout: command.timeout
      });
    }
  }

  async spawnApplication(command: string, options?: TerminalOptions): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.spawnApplication called', { command, options });
    
    try {
      // Detect the best terminal for the current OS
      const terminalCmd = await this.terminalHandler.detectTerminal();
      this.logger.debug('Detected terminal for application', { terminalCmd });
      
      // Get shell
      const shellResult = await this.getShell();
      if (isFailure(shellResult)) {
        return { ok: false, error: shellResult.error };
      }
      const shell = shellResult.value;
      
      // Get terminal arguments for application (non-interactive)
      const args = this.terminalHandler.getTerminalArgsForApp(terminalCmd, shell, command, options?.cwd);
      
      this.logger.debug('Spawning application', { terminalCmd, args });
      
      // Spawn the application process
      const child = spawn(terminalCmd, args, {
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      
      this.logger.log('Application spawned successfully', { terminalCmd, command });
      return { ok: true, value: true };
      
    } catch (error) {
      this.logger.error('Failed to spawn application', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to spawn application: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async getLastCommandsFromTerminals(): Promise<Result<TerminalCommandState[]>> {
    this.logger.debug('TerminalService.getLastCommandsFromTerminals called');
    
    // This is a placeholder implementation
    // In a real implementation, this would capture commands from terminal history
    // For now, return empty array
    return { ok: true, value: [] };
  }

  async isCommandAvailable(command: string): Promise<Result<boolean>> {
    this.logger.debug('TerminalService.isCommandAvailable called', { command });
    
    try {
      const isAvailable = await this.terminalHandler.isCommandAvailable(command);
      return { ok: true, value: isAvailable };
    } catch (error) {
      this.logger.error('Failed to check command availability', { command, error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to check command availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }

  async getShell(): Promise<Result<string>> {
    this.logger.debug('TerminalService.getShell called');
    
    const currentPlatform = platform();
    
    try {
      let shell: string;
      
      switch (currentPlatform) {
        case 'win32':
          // On Windows, try to detect PowerShell first, then fall back to cmd
          const powershellAvailable = await this.terminalHandler.isCommandAvailable('powershell');
          shell = powershellAvailable ? 'powershell' : 'cmd';
          break;
        case 'darwin':
        case 'linux':
          // On Unix-like systems, try to detect bash first, then fall back to sh
          const bashAvailable = await this.terminalHandler.isCommandAvailable('bash');
          shell = bashAvailable ? 'bash' : 'sh';
          break;
        default:
          shell = 'sh';
      }
      
      this.logger.debug('Detected shell', { shell, platform: currentPlatform });
      return { ok: true, value: shell };
      
    } catch (error) {
      this.logger.error('Failed to detect shell', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        ok: false, 
        error: new TerminalError(
          `Failed to detect shell: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ErrorCode.TERMINAL_COMMAND_FAILED
        ) 
      };
    }
  }


  private getDefaultShell(): boolean | string {
    const currentPlatform = platform();
    
    switch (currentPlatform) {
      case 'win32':
        return true; // Use default shell on Windows
      case 'darwin':
      case 'linux':
        return '/bin/sh'; // Use sh on Unix-like systems
      default:
        return true;
    }
  }

  private parseCommand(command: string): [string, string[]] {
    // Simple command parsing - split by spaces
    // In a more sophisticated implementation, this would handle quoted arguments
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    return [cmd, args];
  }

  private async spawnCommand(cmd: string, args: string[], options: SpawnOptions): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, options);
      
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
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}