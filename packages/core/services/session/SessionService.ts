import { ISessionService } from '../../domain/ports/ISessionService';
import { Session, SessionWithFullData, TerminalCommandState } from '../../domain/models/Session';
import { Result, isFailure } from '../../domain/models/Result';
import { SessionRepository } from '@codestate/infrastructure/repositories/SessionRepository';
import { SessionIndexEntry } from '../../domain/schemas/SchemaRegistry';
import { ITerminalService } from '../../domain/ports/ITerminalService';
import { ITerminalCollectionService } from '../../domain/ports/ITerminalCollectionService';
import { IScriptService } from '../../domain/ports/IScriptService';

export class SessionService implements ISessionService {
  private repository: SessionRepository;
  private terminalService?: ITerminalService;
  private terminalCollectionService?: ITerminalCollectionService;
  private scriptService?: IScriptService;

  constructor(
    repository: SessionRepository, 
    terminalService?: ITerminalService,
    terminalCollectionService?: ITerminalCollectionService,
    scriptService?: IScriptService
  ) {
    this.repository = repository;
    this.terminalService = terminalService;
    this.terminalCollectionService = terminalCollectionService;
    this.scriptService = scriptService;
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
      terminalCollections: input.terminalCollections, // NEW: Terminal collection IDs
      scripts: input.scripts, // NEW: Individual script IDs
    };
    const result = await this.repository.save(session);
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: session };
  }

  async updateSession(idOrName: string, input: Partial<Session> & { notes?: string; tags?: string[]; terminalCollections?: string[]; scripts?: string[] }): Promise<Result<Session>> {
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
      terminalCommands: input.terminalCommands ?? oldSession.terminalCommands,
      terminalCollections: input.terminalCollections ?? oldSession.terminalCollections,
      scripts: input.scripts ?? oldSession.scripts,
    };
    const result = await this.repository.save(updated);
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: updated };
  }

  async getSessionById(idOrName: string): Promise<Result<Session>> {
    return this.repository.load(idOrName);
  }

  async resumeSession(idOrName: string): Promise<Result<Session>> {
    return this.repository.load(idOrName);
  }

  async listSessions(filter?: { tags?: string[]; search?: string, loadAll?: boolean }): Promise<Result<Session[] | SessionWithFullData[]>> {
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
    
    // Load full session objects if needed
    if (filter?.loadAll) {
      const fullSessions = await Promise.all(sessions.map(async (s) => {
        const sessionResult = await this.repository.load(s.id);
        if (isFailure(sessionResult)) {
          // If load fails, return a minimal session object based on index entry
          return {
            id: s.id,
            name: s.name,
            projectRoot: s.projectRoot,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            tags: s.tags,
            notes: s.notes,
            files: [],
            git: { branch: '', commit: '', isDirty: false },
            terminalCollectionsData: [],
            scriptsData: []
          } as SessionWithFullData;
        }
        
        const session = sessionResult.value;
        const sessionWithFullData: SessionWithFullData = {
          ...session,
          terminalCollectionsData: [],
          scriptsData: []
        };

        // Load terminal collections data if available
        if (session.terminalCollections && session.terminalCollections.length > 0 && this.terminalCollectionService) {
          const terminalCollectionsData = await Promise.all(
            session.terminalCollections.map(async (collectionId) => {
              const collectionResult = await this.terminalCollectionService!.getTerminalCollectionById(collectionId);
              if (collectionResult.ok) {
                // Load scripts for this terminal collection
                const collectionWithScriptsResult = await this.terminalCollectionService!.getTerminalCollections({ 
                  loadScripts: true 
                });
                if (collectionWithScriptsResult.ok) {
                  const collectionWithScripts = collectionWithScriptsResult.value.find(
                    (c: any) => c.id === collectionId
                  );
                  if (collectionWithScripts) {
                    return collectionWithScripts;
                  }
                }
                return collectionResult.value;
              }
              return null;
            })
          );
          sessionWithFullData.terminalCollectionsData = terminalCollectionsData.filter(Boolean) as any[];
        }

        // Load scripts data if available
        if (session.scripts && session.scripts.length > 0 && this.scriptService) {
          const scriptsData = await Promise.all(
            session.scripts.map(async (scriptId) => {
              const scriptResult = await this.scriptService!.getScriptById(scriptId);
              if (scriptResult.ok) {
                return scriptResult.value;
              }
              return null;
            })
          );
          sessionWithFullData.scriptsData = scriptsData.filter(Boolean) as any[];
        }

        return sessionWithFullData;
      }));
      
      return { ok: true, value: fullSessions };
    }

    // When loadAll is false, return SessionIndexEntry[] as Session[] (lightweight mode)


    return { ok: true, value: sessions as unknown as Session[] };
  }

  async deleteSession(idOrName: string): Promise<Result<void>> {
    return this.repository.delete(idOrName);
  }

  exportSession(idOrName: string, outputPath: string): Promise<Result<void>> {
    throw new Error('Method not implemented.');
  }

  importSession(filePath: string): Promise<Result<Session>> {
    throw new Error('Method not implemented.');
  }
}