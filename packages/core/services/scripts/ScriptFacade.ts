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

  async createScripts(...args: Parameters<IScriptService['createScripts']>) {
    return this.service.createScripts(...args);
  }

  async getScriptsByRootPath(...args: Parameters<IScriptService['getScriptsByRootPath']>) {
    return this.service.getScriptsByRootPath(...args);
  }

  async getAllScripts(...args: Parameters<IScriptService['getAllScripts']>) {
    return this.service.getAllScripts(...args);
  }

  async updateScript(...args: Parameters<IScriptService['updateScript']>) {
    return this.service.updateScript(...args);
  }

  async updateScripts(...args: Parameters<IScriptService['updateScripts']>) {
    return this.service.updateScripts(...args);
  }

  async deleteScript(...args: Parameters<IScriptService['deleteScript']>) {
    return this.service.deleteScript(...args);
  }

  async deleteScripts(...args: Parameters<IScriptService['deleteScripts']>) {
    return this.service.deleteScripts(...args);
  }

  async deleteScriptsByRootPath(...args: Parameters<IScriptService['deleteScriptsByRootPath']>) {
    return this.service.deleteScriptsByRootPath(...args);
  }

  async getScriptIndex(...args: Parameters<IScriptService['getScriptIndex']>) {
    return this.service.getScriptIndex(...args);
  }

  async updateScriptIndex(...args: Parameters<IScriptService['updateScriptIndex']>) {
    return this.service.updateScriptIndex(...args);
  }
} 