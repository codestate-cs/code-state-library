import { IIDEService } from '@codestate/core/domain/ports/IIDEService';
import { IDEFacade } from '@codestate/core/services/ide/IDEFacade';
import { Result } from '@codestate/core/domain/models/Result';

export class OpenIDE {
  private ideService: IIDEService;
  
  constructor(ideService?: IIDEService) {
    this.ideService = ideService || new IDEFacade();
  }
  
  async execute(ideName: string, projectRoot: string): Promise<Result<boolean>> {
    return this.ideService.openIDE(ideName, projectRoot);
  }
} 