import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { TerminalCollection } from '@codestate/core/domain/models/TerminalCollection';
import { Result } from '@codestate/core/domain/models/Result';

export class GetTerminalCollectionById {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(id: string): Promise<Result<TerminalCollection>> {
    return this.terminalCollectionService.getTerminalCollectionById(id);
  }
}