import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Session, SessionWithFullData } from '@codestate/core/domain/models/Session';
import { Result } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';

export class ListSessions {
  private sessionService: ISessionService;
  
  constructor(sessionService?: ISessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  
  async execute(filter?: { tags?: string[]; search?: string, loadAll?: boolean }): Promise<Result<Session[] | SessionWithFullData[]>> {
    return this.sessionService.listSessions(filter);
  }
} 