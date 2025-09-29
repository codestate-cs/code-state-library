import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

export interface ITerminalHandler {
  /**
   * Detects the best available terminal for the current OS
   */
  detectTerminal(): Promise<string>;

  /**
   * Gets terminal arguments for spawning a new terminal window
   * @param terminalCmd The terminal command to use
   * @param shell The shell to execute
   * @param command The command to run
   * @param cwd Optional working directory
   */
  getTerminalArgs(terminalCmd: string, shell: string, command: string, cwd?: string): string[];

  /**
   * Gets terminal arguments for spawning an application (non-interactive)
   * @param terminalCmd The terminal command to use
   * @param shell The shell to execute
   * @param command The command to run
   * @param cwd Optional working directory
   */
  getTerminalArgsForApp(terminalCmd: string, shell: string, command: string, cwd?: string): string[];

  /**
   * Checks if a command is available on this OS
   * @param command The command to check
   */
  isCommandAvailable(command: string): Promise<boolean>;
}

export interface TerminalDetectionResult {
  terminal: string;
  isAvailable: boolean;
}

export interface TerminalArgsOptions {
  shell: string;
  command: string;
  cwd?: string;
  title?: string;
  useTabs?: boolean;
}
