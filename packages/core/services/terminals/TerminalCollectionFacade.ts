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
    const repository = new TerminalCollectionRepository(_logger, storage);
    const terminalService = new TerminalFacade(_logger);
    const scriptService = new ScriptFacade();
    
    this.service = new TerminalCollectionService(repository, terminalService, scriptService, _logger);
  }

  async createTerminalCollection(terminalCollection: any): Promise<any> {
    return this.service.createTerminalCollection(terminalCollection);
  }

  async getTerminalCollection(name: string, rootPath?: string): Promise<any> {
    return this.service.getTerminalCollection(name, rootPath);
  }

  async getTerminalCollectionById(id: string): Promise<any> {
    return this.service.getTerminalCollectionById(id);
  }

  async getTerminalCollectionWithScripts(name: string, rootPath?: string): Promise<any> {
    return this.service.getTerminalCollectionWithScripts(name, rootPath);
  }

  async getTerminalCollectionWithScriptsById(id: string): Promise<any> {
    return this.service.getTerminalCollectionWithScriptsById(id);
  }

  async getAllTerminalCollections(): Promise<any> {
    return this.service.getAllTerminalCollections();
  }

  async getAllTerminalCollectionsWithScripts(): Promise<any> {
    return this.service.getAllTerminalCollectionsWithScripts();
  }

  async getTerminalCollectionsByRootPath(rootPath: string): Promise<any> {
    return this.service.getTerminalCollectionsByRootPath(rootPath);
  }

  async getTerminalCollectionsByRootPathWithScripts(rootPath: string): Promise<any> {
    return this.service.getTerminalCollectionsByRootPathWithScripts(rootPath);
  }

  async getTerminalCollectionsByLifecycle(lifecycle: any, rootPath: string): Promise<any> {
    return this.service.getTerminalCollectionsByLifecycle(lifecycle, rootPath);
  }

  async updateTerminalCollection(name: string, rootPath: string, terminalCollectionUpdate: any): Promise<any> {
    return this.service.updateTerminalCollection(name, rootPath, terminalCollectionUpdate);
  }

  async deleteTerminalCollection(name: string, rootPath: string): Promise<any> {
    return this.service.deleteTerminalCollection(name, rootPath);
  }

  async deleteTerminalCollectionById(id: string): Promise<any> {
    return this.service.deleteTerminalCollectionById(id);
  }

  async deleteTerminalCollectionsByRootPath(rootPath: string): Promise<any> {
    return this.service.deleteTerminalCollectionsByRootPath(rootPath);
  }

  async executeTerminalCollection(name: string, rootPath?: string): Promise<any> {
    return this.service.executeTerminalCollection(name, rootPath);
  }

  async executeTerminalCollectionById(id: string): Promise<any> {
    return this.service.executeTerminalCollectionById(id);
  }
}
