import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { Result } from '@codestate/core/domain/models/Result';

export class ExecuteTerminalCollection {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(name: string, rootPath?: string): Promise<Result<void>> {
    return this.terminalCollectionService.executeTerminalCollection(name, rootPath);
  }

  async executeById(id: string): Promise<Result<void>> {
    return this.terminalCollectionService.executeTerminalCollectionById(id);
  }
}
