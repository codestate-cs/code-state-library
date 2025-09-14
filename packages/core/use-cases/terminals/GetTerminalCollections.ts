import { ITerminalCollectionService } from '@codestate/core/domain/ports/ITerminalCollectionService';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { TerminalCollectionWithScripts } from '@codestate/core/domain/models/TerminalCollection';
import { LifecycleEvent } from '@codestate/core/domain/models/Script';
import { Result } from '@codestate/core/domain/models/Result';

export interface GetTerminalCollectionsOptions {
  rootPath?: string;
  lifecycle?: LifecycleEvent;
  loadScripts?: boolean;
}

export class GetTerminalCollections {
  private terminalCollectionService: ITerminalCollectionService;
  
  constructor(terminalCollectionService?: ITerminalCollectionService) {
    this.terminalCollectionService = terminalCollectionService || new TerminalCollectionFacade();
  }
  
  async execute(options?: GetTerminalCollectionsOptions): Promise<Result<TerminalCollectionWithScripts[]>> {
    const defaultOptions = { loadScripts: true };
    const finalOptions = { ...defaultOptions, ...options };
    return this.terminalCollectionService.getTerminalCollections(finalOptions) as Promise<Result<TerminalCollectionWithScripts[]>>;
  }
} 