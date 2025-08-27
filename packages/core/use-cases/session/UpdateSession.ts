import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Session } from '@codestate/core/domain/models/Session';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';

export class UpdateSession {
  private sessionService: ISessionService;
  
  constructor(sessionService?: ISessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  
  async execute(idOrName: string, input: {
    notes?: string;
    tags?: string[];
    files?: Session['files'];
    git?: Session['git'];
    extensions?: Session['extensions'];
    terminalCommands?: Session['terminalCommands'];
    terminalCollections?: Session['terminalCollections'];
    scripts?: Session['scripts'];
  }): Promise<Result<Session>> {
    return this.sessionService.updateSession(idOrName, input);
  }
} 