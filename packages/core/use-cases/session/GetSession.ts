import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Session } from '@codestate/core/domain/models/Session';
import { Result } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';

export class GetSession {
  private sessionService: ISessionService;
  
  constructor(sessionService?: ISessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  
  async execute(idOrName: string): Promise<Result<Session>> {
    return this.sessionService.getSessionById(idOrName);
  }
}