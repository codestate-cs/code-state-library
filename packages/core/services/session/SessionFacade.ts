// Main entry point for CLI/IDE to interact with sessions (no DI required)
import { SessionService } from '@codestate/core/services/session/SessionService';
import { SessionRepository } from '@codestate/infrastructure/repositories/SessionRepository';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import { Session } from '@codestate/core/domain/models/Session';
import { Result } from '@codestate/core/domain/models/Result';
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
    this.service = new SessionService(repository);
  }

  async saveSession(...args: Parameters<ISessionService['saveSession']>) {
    return this.service.saveSession(...args);
  }

  async updateSession(...args: Parameters<ISessionService['updateSession']>) {
    return this.service.updateSession(...args);
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