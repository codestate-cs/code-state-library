import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { TerminalCollection } from '@codestate/core/domain/models/TerminalCollection';
import { Result } from '@codestate/core/domain/models/Result';

export class UpdateTerminalCollection {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(name: string, rootPath: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    return this.terminalCollectionService.updateTerminalCollection(name, rootPath, terminalCollectionUpdate);
  }
}
