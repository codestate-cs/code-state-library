import { Session } from '@codestate/core/domain/models/Session';
import { validateSession, validateSessionIndex, SessionIndex, SessionIndexEntry } from '@codestate/core/domain/schemas/SchemaRegistry';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ConfigurableLogger } from '@codestate/infrastructure/services/ConfigurableLogger/ConfigurableLogger';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { StorageError } from '@codestate/core/domain/types/ErrorTypes';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

const SESSION_INDEX_PATH = 'sessions/index.json';
const SESSION_FILE_PREFIX = 'sessions/';
const SESSION_FILE_SUFFIX = '.json';
const SESSION_INDEX_VERSION = '1.0.0';

export class SessionRepository {
  private logger: ILoggerService;
  private storage: FileStorage;

  constructor(logger: ILoggerService, storage: FileStorage) {
    this.logger = logger;
    this.storage = storage;
  }

  private getSessionFileName(id: string) {
    return `${SESSION_FILE_PREFIX}${id}${SESSION_FILE_SUFFIX}`;
  }

  async load(idOrName: string): Promise<Result<Session, StorageError>> {
    this.logger.debug(`Loading session: ${idOrName}`);
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) return indexResult;
    const entry = indexResult.value.sessions.find(s => s.id === idOrName || s.name === idOrName);
    if (!entry) {
      return { ok: false, error: new StorageError('Session not found', undefined, { idOrName }) };
    }
    const fileResult = await this.storage.read(entry.referenceFile);
    if (isFailure(fileResult)) return fileResult;
    try {
      const validatedSession = validateSession(JSON.parse(fileResult.value));
      // Ensure createdAt and updatedAt are Date objects and required
      const session: Session = {
        ...validatedSession,
        createdAt: validatedSession.createdAt || new Date(),
        updatedAt: validatedSession.updatedAt || new Date(),
      };
      return { ok: true, value: session };
    } catch (error) {
      this.logger.error('Session validation failed', { error });
      return { ok: false, error: new StorageError('Session validation failed', undefined, { error }) };
    }
  }

  async save(session: Session): Promise<Result<void, StorageError>> {
    this.logger.debug(`Saving session: ${session.id}`);
    try {
      validateSession(session);
    } catch (error) {
      this.logger.error('Session validation failed', { error });
      return { ok: false, error: new StorageError('Session validation failed', undefined, { error }) };
    }
    // Write session file
    const fileName = this.getSessionFileName(session.id);
    const writeResult = await this.storage.write(fileName, JSON.stringify(session));
    if (isFailure(writeResult)) return writeResult;
    // Update index
    const indexResult = await this.getIndex();
    let index: SessionIndex;
    if (isFailure(indexResult)) {
      // If index doesn't exist, create new
      index = { version: SESSION_INDEX_VERSION, sessions: [] };
    } else {
      index = indexResult.value;
    }
    // Remove any existing entry for this id
    index.sessions = index.sessions.filter(s => s.id !== session.id);
    // Add new entry
    const entry: SessionIndexEntry = {
      id: session.id,
      name: session.name,
      projectRoot: session.projectRoot,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      tags: session.tags,
      notes: session.notes,
      referenceFile: fileName,
    };
    index.sessions.push(entry);
    // Write index
    const indexWrite = await this.storage.write(SESSION_INDEX_PATH, JSON.stringify(index));
    if (isFailure(indexWrite)) return indexWrite;
    return { ok: true, value: undefined };
  }

  async delete(idOrName: string): Promise<Result<void, StorageError>> {
    this.logger.debug(`Deleting session: ${idOrName}`);
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) return indexResult;
    const index = indexResult.value;
    const entry = index.sessions.find(s => s.id === idOrName || s.name === idOrName);
    if (!entry) {
      return { ok: false, error: new StorageError('Session not found', undefined, { idOrName }) };
    }
    // Delete session file
    const delResult = await this.storage.delete(entry.referenceFile);
    if (isFailure(delResult)) return delResult;
    // Remove from index
    index.sessions = index.sessions.filter(s => s.id !== entry.id);
    const indexWrite = await this.storage.write(SESSION_INDEX_PATH, JSON.stringify(index));
    if (isFailure(indexWrite)) return indexWrite;
    return { ok: true, value: undefined };
  }

  async list(): Promise<Result<SessionIndexEntry[], StorageError>> {
    this.logger.debug('Listing all sessions');
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) return indexResult;
    return { ok: true, value: indexResult.value.sessions };
  }

  private async getIndex(): Promise<Result<SessionIndex, StorageError>> {
    const readResult = await this.storage.read(SESSION_INDEX_PATH);
    if (isFailure(readResult)) {
      // If file not found, create a new empty index
      if (readResult.error.code === 'STORAGE_READ_FAILED') {
        const emptyIndex: SessionIndex = { version: SESSION_INDEX_VERSION, sessions: [] };
        return { ok: true, value: emptyIndex };
      }
      return { ok: false, error: readResult.error };
    }
    try {
      const index = validateSessionIndex(JSON.parse(readResult.value));
      return { ok: true, value: index };
    } catch (error) {
      this.logger.error('Session index validation failed', { error });
      return { ok: false, error: new StorageError('Session index validation failed', undefined, { error }) };
    }
  }
}