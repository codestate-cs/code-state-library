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
    // First get the terminal collection by name and rootPath to find its ID
    const collectionsResult = await this.terminalCollectionService.getTerminalCollections({
      rootPath,
      loadScripts: false
    });
    
    if (!collectionsResult.ok) {
      return collectionsResult;
    }
    
    const collections = collectionsResult.value;
    const matchingCollection = collections.find(c => c.name === name && c.rootPath === rootPath);
    
    if (!matchingCollection) {
      return {
        ok: false,
        error: new Error(`Terminal collection '${name}' not found in root path '${rootPath}'`)
      };
    }
    
    // Now update using the ID
    return this.terminalCollectionService.updateTerminalCollection(matchingCollection.id, terminalCollectionUpdate);
  }
}
