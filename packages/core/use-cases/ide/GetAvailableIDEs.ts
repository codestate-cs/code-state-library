import { IIDEService } from '@codestate/core/domain/ports/IIDEService';
import { IDEFacade } from '@codestate/core/services/ide/IDEFacade';
import { IDE } from '@codestate/core/domain/models/IDE';
import { Result } from '@codestate/core/domain/models/Result';

export class GetAvailableIDEs {
  private ideService: IIDEService;
  
  constructor(ideService?: IIDEService) {
    this.ideService = ideService || new IDEFacade();
  }
  
  async execute(): Promise<Result<IDE[]>> {
    return this.ideService.getAvailableIDEs();
  }
} 