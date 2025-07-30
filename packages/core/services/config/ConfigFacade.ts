// Main entry point for CLI/IDE to interact with config (no DI required)
import { ConfigService } from '@codestate/core/services/config/ConfigService';
import { ConfigRepository } from '@codestate/infrastructure/repositories/ConfigRepository';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import * as path from 'path';

export class ConfigFacade implements IConfigService {
  private service: ConfigService;

  constructor(
    configPath?: string,
    logger?: ILoggerService,
    encryption?: IEncryptionService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    const repository = new ConfigRepository(_logger, _encryption, configPath);
    this.service = new ConfigService(repository, _logger);
  }

  async getConfig(...args: Parameters<IConfigService['getConfig']>) {
    return this.service.getConfig(...args);
  }
  async setConfig(...args: Parameters<IConfigService['setConfig']>) {
    return this.service.setConfig(...args);
  }
  async updateConfig(...args: Parameters<IConfigService['updateConfig']>) {
    return this.service.updateConfig(...args);
  }
} 