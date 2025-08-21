import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { TerminalCollectionWithScripts } from '@codestate/core/domain/models/TerminalCollection';
import { Result } from '@codestate/core/domain/models/Result';

export class GetTerminalCollection {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(name: string, rootPath?: string): Promise<Result<TerminalCollectionWithScripts>> {
    return this.terminalCollectionService.getTerminalCollectionWithScripts(name, rootPath);
  }
}
