// Main entry point for CLI/IDE to interact with Terminal (no DI required)
import { TerminalService } from '@codestate/infrastructure/services/Terminal/TerminalService';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { TerminalCommand, TerminalResult, TerminalOptions } from '@codestate/core/domain/models/Terminal';
import { Result } from '@codestate/core/domain/models/Result';
import * as path from 'path';

export class TerminalFacade implements ITerminalService {
  private service: TerminalService;

  constructor(logger?: ILoggerService) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    this.service = new TerminalService(_logger);
  }

  async execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>> {
    return this.service.execute(command, options);
  }

  async executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>> {
    return this.service.executeCommand(command);
  }

  async executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>> {
    return this.service.executeBatch(commands);
  }

  async spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>> {
    return this.service.spawnTerminal(command, options);
  }

  async spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>> {
    return this.service.spawnTerminalCommand(command);
  }

  async isCommandAvailable(command: string): Promise<Result<boolean>> {
    return this.service.isCommandAvailable(command);
  }

  async getShell(): Promise<Result<string>> {
    return this.service.getShell();
  }
} 