// Main entry point for CLI/IDE to interact with file storage (no DI required)
import { FileStorage } from '@codestate/core/infrastructure/services/FileStorage';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { IStorageService } from '@codestate/core/domain/ports/IStorageService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import * as path from 'path';

interface FileStorageConfig {
  encryptionEnabled?: boolean;
  encryptionKey?: string;
  dataDir?: string;
}

export class FileStorageFacade implements IStorageService {
  private service: FileStorage;

  constructor(
    config?: FileStorageConfig,
    logger?: ILoggerService,
    encryption?: IEncryptionService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    const _encryption = encryption || new BasicEncryption(_logger);
    
    const defaultConfig = {
      encryptionEnabled: false,
      dataDir: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'data')
    };
    
    const finalConfig = { ...defaultConfig, ...config };
    this.service = new FileStorage(_logger, _encryption, finalConfig);
  }

  async read(path: string) {
    return this.service.read(path);
  }

  async write(path: string, data: string) {
    return this.service.write(path, data);
  }

  async exists(path: string) {
    return this.service.exists(path);
  }

  async delete(path: string) {
    return this.service.delete(path);
  }
}
