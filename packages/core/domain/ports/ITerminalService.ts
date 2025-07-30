import { TerminalCommand, TerminalResult, TerminalOptions } from '../models/Terminal';
import { Result } from '../models/Result';

export interface ITerminalService {
  // Command execution
  execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>>;
  executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>>;
  
  // Batch operations
  executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>>;
  
  // Terminal spawning
  spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>>;
  spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>>;
  
  // Utility methods
  isCommandAvailable(command: string): Promise<Result<boolean>>;
  getShell(): Promise<Result<string>>;
} 