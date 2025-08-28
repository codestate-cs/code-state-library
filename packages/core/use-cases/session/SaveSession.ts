import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { Session } from '@codestate/core/domain/models/Session';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { SessionFacade } from '@codestate/core/services/session/SessionFacade';
import { randomUUID } from 'crypto';

export class SaveSession {
  private sessionService: ISessionService;
  
  constructor(sessionService?: ISessionService) {
    this.sessionService = sessionService || new SessionFacade();
  }
  
  async execute(input: {
    name: string;
    projectRoot: string;
    notes?: string;
    tags?: string[];
    files?: Session['files'];
    git: Session['git'];
    extensions?: Session['extensions'];
    terminalCommands?: Session['terminalCommands'];
    terminalCollections?: Session['terminalCollections'];
    scripts?: Session['scripts'];
  }): Promise<Result<Session>> {
    const sessionId = randomUUID();
    const now = new Date();
    
    return this.sessionService.saveSession({
      id: sessionId,
      name: input.name,
      projectRoot: input.projectRoot,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      tags: input.tags || [],
      files: input.files || [],
      git: input.git,
      extensions: input.extensions,
      terminalCommands: input.terminalCommands,
      terminalCollections: input.terminalCollections,
      scripts: input.scripts,
    });
  }
} 