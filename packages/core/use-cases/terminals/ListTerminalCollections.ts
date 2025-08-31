import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { TerminalCollectionWithScripts } from '@codestate/core/domain/models/TerminalCollection';
import { Result } from '@codestate/core/domain/models/Result';

export class ListTerminalCollections {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(): Promise<Result<TerminalCollectionWithScripts[]>> {
    const result = await this.terminalCollectionService.getTerminalCollections({
      loadScripts: true
    });
    
    if (!result.ok) {
      return result;
    }
    
    return { ok: true, value: result.value as TerminalCollectionWithScripts[] };
  }
}
