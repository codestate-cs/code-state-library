import { Result } from '@codestate/core/domain/models/Result';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';
import { getDefaultConfig } from './utils';
import * as path from 'path';
import * as fs from 'fs/promises';

export type ResetOptions = {
  sessions?: boolean;
  scripts?: boolean;
  terminals?: boolean;
  config?: boolean;
  all?: boolean;
};

export class ResetAll {
  private fileStorage: FileStorage | null = null;
  private dataDir: string | null = null;
  private configService: ConfigFacade;

  constructor(dataDir?: string) {
    this.configService = new ConfigFacade();
    
    // If dataDir is provided, use it immediately
    if (dataDir) {
      this.dataDir = dataDir;
      this.initializeServices();
    }
  }

  private async initializeServices(): Promise<void> {
    if (!this.dataDir) {
      // Get config from ConfigService
      const configResult = await this.configService.getConfig();
      if (configResult.ok && configResult.value.storagePath) {
        this.dataDir = configResult.value.storagePath;
      } else {
        // Fallback to default path
        this.dataDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate');
      }
    }
    
    // Create a simple logger for this operation
    const logger = new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(this.dataDir, 'logs', 'reset.log')
    });
    
    // Create file storage service
    this.fileStorage = new FileStorage(logger, new BasicEncryption(logger), {
      encryptionEnabled: false,
      dataDir: this.dataDir
    });
  }

  private ensureDataDir(): string {
    if (!this.dataDir) {
      throw new Error('Data directory not initialized. Call execute() first.');
    }
    return this.dataDir;
  }

  private async getDefaultDataDir(): Promise<string> {
    try {
      // Get config from ConfigService
      const configResult = await this.configService.getConfig();
      if (configResult.ok && configResult.value.storagePath) {
        return configResult.value.storagePath;
      }
    } catch (error) {
      // If config service fails, use default
    }
    
    // Fallback to default path
    return path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate');
  }

  async execute(options: ResetOptions): Promise<Result<{ resetItems: string[] }>> {
    try {
      // Ensure services are initialized
      if (!this.fileStorage || !this.dataDir) {
        await this.initializeServices();
      }

      if (!this.dataDir) {
        return {
          ok: false,
          error: new Error('Failed to initialize data directory'),
        };
      }

      const resetItems: string[] = [];
      
      // Determine what to reset based on options
      const shouldResetAll = options.all || (options.sessions && options.scripts && options.terminals && options.config);
      const shouldResetSessions = shouldResetAll || options.sessions;
      const shouldResetScripts = shouldResetAll || options.scripts;
      const shouldResetTerminals = shouldResetAll || options.terminals;
      const shouldResetConfig = shouldResetAll || options.config;

      // Reset sessions
      if (shouldResetSessions) {
        await this.resetSessions();
        resetItems.push('sessions');
      }

      // Reset scripts
      if (shouldResetScripts) {
        await this.resetScripts();
        resetItems.push('scripts');
      }

      // Reset terminal collections
      if (shouldResetTerminals) {
        await this.resetTerminals();
        resetItems.push('terminals');
      }

      // Reset config
      if (shouldResetConfig) {
        await this.resetConfig();
        resetItems.push('config');
      }

      // If resetting all, also clean up the data directory structure
      if (shouldResetAll) {
        await this.cleanupDataDirectory();
      }

      return { ok: true, value: { resetItems } };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Unknown error during reset'),
      };
    }
  }

  private async resetSessions(): Promise<void> {
    try {
      const dataDir = this.ensureDataDir();
      const sessionsDir = path.join(dataDir, 'sessions');
      await fs.rm(sessionsDir, { recursive: true, force: true });
      await fs.mkdir(sessionsDir, { recursive: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  }

  private async resetScripts(): Promise<void> {
    try {
      const dataDir = this.ensureDataDir();
      const scriptsDir = path.join(dataDir, 'scripts');
      await fs.rm(scriptsDir, { recursive: true, force: true });
      await fs.mkdir(scriptsDir, { recursive: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  }

  private async resetTerminals(): Promise<void> {
    try {
      const dataDir = this.ensureDataDir();
      const terminalsDir = path.join(dataDir, 'terminals');
      await fs.rm(terminalsDir, { recursive: true, force: true });
      await fs.mkdir(terminalsDir, { recursive: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  }

  private async resetConfig(): Promise<void> {
    try {
      const dataDir = this.ensureDataDir();
      const configPath = path.join(dataDir, 'config.json');
      const defaultConfig = getDefaultConfig(dataDir);

      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  }

  private async cleanupDataDirectory(): Promise<void> {
    try {
      const dataDir = this.ensureDataDir();
      
      // Remove all subdirectories including logs
      const subdirs = ['sessions', 'scripts', 'terminals', 'logs'];
      for (const subdir of subdirs) {
        const subdirPath = path.join(dataDir, subdir);
        try {
          await fs.rm(subdirPath, { recursive: true, force: true });
        } catch (error) {
          // Ignore errors if directory doesn't exist
        }
      }

      // Remove all index and config files
      const filesToRemove = [
        'index.json', 
        'script-index.json', 
        'terminal-collection-index.json',
        'config.json'
      ];
      
      for (const file of filesToRemove) {
        const filePath = path.join(dataDir, file);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }
    } catch (error) {
      // Ignore cleanup errors - this is not critical
    }
  }
} 