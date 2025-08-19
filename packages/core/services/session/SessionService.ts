import { ISessionService } from '../../domain/ports/ISessionService';
import { Session, TerminalCommandState } from '../../domain/models/Session';
import { Result, isFailure } from '../../domain/models/Result';
import { SessionRepository } from '@codestate/infrastructure/repositories/SessionRepository';
import { SessionIndexEntry } from '../../domain/schemas/SchemaRegistry';
import { ITerminalService } from '../../domain/ports/ITerminalService';

export class SessionService implements ISessionService {
  private repository: SessionRepository;
  private terminalService?: ITerminalService;

  constructor(repository: SessionRepository, terminalService?: ITerminalService) {
    this.repository = repository;
    this.terminalService = terminalService;
  }

  async saveSession(input: Partial<Session> & { name: string; projectRoot: string; notes?: string; tags?: string[] }): Promise<Result<Session>> {
    // Capture terminal commands if terminal service is available
    let terminalCommands: TerminalCommandState[] | undefined;
    if (this.terminalService) {
      const terminalResult = await this.terminalService.getLastCommandsFromTerminals();
      if (terminalResult.ok && terminalResult.value.length > 0) {
        terminalCommands = terminalResult.value;
      }
    }

    // Generate session object (id, timestamps, etc. should be handled by caller for now)
    const session: Session = {
      id: input.id || `session-${Date.now()}`,
      name: input.name,
      projectRoot: input.projectRoot,
      createdAt: input.createdAt || new Date(),
      updatedAt: new Date(),
      tags: input.tags || [],
      notes: input.notes,
      files: input.files || [],
      git: input.git!,
      extensions: input.extensions,
      terminalCommands, // NEW: Terminal commands captured from open terminals
    };
    const result = await this.repository.save(session);
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: session };
  }

  async updateSession(idOrName: string, input: Partial<Session> & { notes?: string; tags?: string[] }): Promise<Result<Session>> {
    const loadResult = await this.repository.load(idOrName);
    if (isFailure(loadResult)) return { ok: false, error: loadResult.error };
    const oldSession = loadResult.value;
    const updated: Session = {
      ...oldSession,
      updatedAt: new Date(),
      notes: input.notes ?? oldSession.notes,
      tags: input.tags ?? oldSession.tags,
      files: input.files ?? oldSession.files,
      git: input.git ?? oldSession.git,
      extensions: input.extensions ?? oldSession.extensions,
    };
    const result = await this.repository.save(updated);
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: updated };
  }

  async resumeSession(idOrName: string): Promise<Result<Session>> {
    return this.repository.load(idOrName);
  }

  async listSessions(filter?: { tags?: string[]; search?: string }): Promise<Result<Session[]>> {
    const result = await this.repository.list();
    if (isFailure(result)) return { ok: false, error: result.error };
    let sessions = result.value;
    if (filter?.tags) {
      sessions = sessions.filter(s => filter.tags!.every(tag => s.tags.includes(tag)));
    }
    if (filter?.search) {
      const term = filter.search.toLowerCase();
      sessions = sessions.filter(s => s.name.toLowerCase().includes(term) || (s.notes?.toLowerCase().includes(term)));
    }
    // Optionally, load full session objects if needed (for now, just return index entries)
    // If full objects needed, map: await Promise.all(sessions.map(s => this.repository.load(s.id)))
    return { ok: true, value: sessions as unknown as Session[] };
  }

  async deleteSession(idOrName: string): Promise<Result<void>> {
    return this.repository.delete(idOrName);
  }

  exportSession(idOrName: string, outputPath: string): Promise<Result<string>> {
    throw new Error('Method not implemented.');
  }

  importSession(filePath: string): Promise<Result<Session>> {
    throw new Error('Method not implemented.');
  }
}