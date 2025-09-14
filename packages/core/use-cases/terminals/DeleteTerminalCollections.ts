import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { Result } from '@codestate/core/domain/models/Result';

export class DeleteTerminalCollections {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(ids: string[]): Promise<Result<void>> {
    return this.terminalCollectionService.deleteTerminalCollections(ids);
  }
}