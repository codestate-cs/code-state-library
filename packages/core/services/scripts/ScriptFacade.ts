// Main entry point for CLI/IDE to interact with scripts (no DI required)
import { ScriptService } from '@codestate/core/services/scripts/ScriptService';
import { ScriptRepository } from '@codestate/infrastructure/repositories/ScriptRepository';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';
import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import * as path from 'path';

export class ScriptFacade implements IScriptService {
  private service: ScriptService;

  constructor(
    scriptsDir?: string,
    logger?: ILoggerService,
    encryption?: IEncryptionService,
    configService?: IConfigService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const _configService = configService || new ConfigFacade();
    const repository = new ScriptRepository(_logger, _encryption, _configService, scriptsDir);
    this.service = new ScriptService(repository, _logger);
  }

  async createScript(...args: Parameters<IScriptService['createScript']>) {
    return this.service.createScript(...args);
  }

  async getScriptById(...args: Parameters<IScriptService['getScriptById']>) {
    return this.service.getScriptById(...args);
  }

  async getScripts(...args: Parameters<IScriptService['getScripts']>) {
    return this.service.getScripts(...args);
  }

  async updateScript(...args: Parameters<IScriptService['updateScript']>) {
    return this.service.updateScript(...args);
  }

  async deleteScripts(...args: Parameters<IScriptService['deleteScripts']>) {
    return this.service.deleteScripts(...args);
  }

  async exportScripts(...args: Parameters<IScriptService['exportScripts']>) {
    return this.service.exportScripts(...args);
  }

  async importScripts(...args: Parameters<IScriptService['importScripts']>) {
    return this.service.importScripts(...args);
  }
} 