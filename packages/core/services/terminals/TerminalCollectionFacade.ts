import { ITerminalCollectionService } from '../../domain/ports/ITerminalCollectionService';
import { TerminalCollectionService } from './TerminalCollectionService';
import { TerminalCollectionRepository } from '@codestate/core/infrastructure/repositories/TerminalCollectionRepository';
import { TerminalFacade } from '@codestate/core/infrastructure/services/Terminal/TerminalFacade';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';
import { FileLogger } from '@codestate/core/infrastructure/services/FileLogger';
import { FileStorage } from '@codestate/core/infrastructure/services/FileStorage';
import { BasicEncryption } from '@codestate/core/infrastructure/services/BasicEncryption';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import * as path from 'path';

export class TerminalCollectionFacade implements ITerminalCollectionService {
  private service: TerminalCollectionService;

  constructor(
    terminalsDir?: string,
    logger?: ILoggerService,
    encryption?: IEncryptionService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'terminals.log')
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const fileStorageConfig = {
      encryptionEnabled: false,
      dataDir: terminalsDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate'),
    };
    const storage = new FileStorage(_logger, _encryption, fileStorageConfig);
    const scriptService = new ScriptFacade();
    const repository = new TerminalCollectionRepository(_logger, storage, scriptService);
    const terminalService = new TerminalFacade(_logger);
    
    this.service = new TerminalCollectionService(repository, terminalService, scriptService, _logger);
  }

  async createTerminalCollection(terminalCollection: any): Promise<any> {
    return this.service.createTerminalCollection(terminalCollection);
  }

  async getTerminalCollectionById(id: string): Promise<any> {
    return this.service.getTerminalCollectionById(id);
  }

  async getTerminalCollections(options?: { rootPath?: string; lifecycle?: any; loadScripts?: boolean }): Promise<any> {
    return this.service.getTerminalCollections(options);
  }

  async updateTerminalCollection(id: string, terminalCollectionUpdate: any): Promise<any> {
    return this.service.updateTerminalCollection(id, terminalCollectionUpdate);
  }

  async deleteTerminalCollections(ids: string[]): Promise<any> {
    return this.service.deleteTerminalCollections(ids);
  }

  async executeTerminalCollectionById(id: string): Promise<any> {
    return this.service.executeTerminalCollectionById(id);
  }
}
