// Main entry point for CLI/IDE to interact with sessions (no DI required)
import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { SessionService } from './SessionService';
import { SessionRepository } from '@codestate/infrastructure/repositories/SessionRepository';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import { TerminalFacade } from '@codestate/infrastructure/services/Terminal/TerminalFacade';
import { TerminalCollectionFacade } from '@codestate/core/services/terminals/TerminalCollectionFacade';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';
import * as path from 'path';

export class SessionFacade implements ISessionService {
  private service: SessionService;

  constructor(
    sessionsDir?: string,
    logger?: ILoggerService,
    encryption?: IEncryptionService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'session.log')
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const fileStorageConfig = {
      encryptionEnabled: false,
      dataDir: sessionsDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate'),
    };
    const storage = new FileStorage(_logger, _encryption, fileStorageConfig);
    const repository = new SessionRepository(_logger, storage);
    const terminalService = new TerminalFacade(_logger); // NEW: Terminal service for command capture
    const terminalCollectionService = new TerminalCollectionFacade(); // NEW: Terminal collection service
    const scriptService = new ScriptFacade(); // NEW: Script service
    this.service = new SessionService(repository, terminalService, terminalCollectionService, scriptService); // NEW: Pass all services
  }

  async saveSession(...args: Parameters<ISessionService['saveSession']>) {
    return this.service.saveSession(...args);
  }

  async updateSession(...args: Parameters<ISessionService['updateSession']>) {
    return this.service.updateSession(...args);
  }

  async getSessionById(...args: Parameters<ISessionService['getSessionById']>) {
    return this.service.getSessionById(...args);
  }

  async resumeSession(...args: Parameters<ISessionService['resumeSession']>) {
    return this.service.resumeSession(...args);
  }

  async listSessions(...args: Parameters<ISessionService['listSessions']>) {
    return this.service.listSessions(...args);
  }

  async deleteSession(...args: Parameters<ISessionService['deleteSession']>) {
    return this.service.deleteSession(...args);
  }

  async exportSession(...args: Parameters<ISessionService['exportSession']>) {
    return this.service.exportSession(...args);
  }

  async importSession(...args: Parameters<ISessionService['importSession']>) {
    return this.service.importSession(...args);
  }
}

export default SessionFacade;