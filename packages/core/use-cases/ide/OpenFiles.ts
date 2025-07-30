import { IIDEService } from '@codestate/core/domain/ports/IIDEService';
import { IDEFacade } from '@codestate/core/services/ide/IDEFacade';
import { FileOpenRequest } from '@codestate/core/domain/models/IDE';
import { Result } from '@codestate/core/domain/models/Result';

export class OpenFiles {
  private ideService: IIDEService;
  
  constructor(ideService?: IIDEService) {
    this.ideService = ideService || new IDEFacade();
  }
  
  async execute(request: FileOpenRequest): Promise<Result<boolean>> {
    return this.ideService.openFiles(request);
  }
} 