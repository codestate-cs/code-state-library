import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Result } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';

export class DeleteSession {
  private sessionService: ISessionService;
  
  constructor(sessionService?: ISessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  
  async execute(idOrName: string): Promise<Result<void>> {
    return this.sessionService.deleteSession(idOrName);
  }
} 