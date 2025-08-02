import { IConfigRepository } from '../../core/domain/ports/IConfigService';
import { Config } from '../../core/domain/models/Config';
import { Result, isFailure } from '../../core/domain/models/Result';
import { validateConfig } from '../../core/domain/schemas/SchemaRegistry';
import { ILoggerService } from '../../core/domain/ports/ILoggerService';
import { IEncryptionService } from '../../core/domain/ports/IEncryptionService';
import { ErrorRegistry, getUserMessageForErrorCode } from '../../core/domain/types/ErrorRegistry';
import { ConfigError } from '../../core/domain/types/ErrorTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

const DEFAULT_CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'config.json');
const TEMP_SUFFIX = '.tmp';
const BACKUP_SUFFIX = '.bak';

function getDefaultConfig(): Config {
  return {
    version: '1.0.0',
    ide: 'vscode',
    encryption: { enabled: false },
    storagePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate'),
    logger: { 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    },
    experimental: {},
    extensions: {},
  };
}

export class ConfigRepository implements IConfigRepository {
  constructor(
    private logger: ILoggerService,
    private encryption: IEncryptionService,
    private configPath: string = DEFAULT_CONFIG_PATH
  ) {}

  async load(): Promise<Result<Config>> {
    try {
      await this.ensureDir();
      this.logger.debug('Attempting to load config', { path: this.configPath });
      const raw = await fs.readFile(this.configPath, { encoding: 'utf8' });
      let data = raw;
      // Try decrypt if header present or config says so
      if (raw.startsWith('ENCRYPTED_v1')) {
        this.logger.log('Config file is encrypted. Attempting decryption.', { path: this.configPath });
        // Prompt for key or use env/config (not interactive here)
        // For now, try with empty key and fail gracefully
        const key = '';
        const decrypted = await this.encryption.decrypt(raw, key);
        if (isFailure(decrypted)) {
          this.logger.error('Decryption failed', { error: decrypted.error });
          return { ok: false, error: decrypted.error };
        }
        data = decrypted.value;
      }
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (parseErr) {
        this.logger.error('Config file is corrupt (invalid JSON). Backing up and creating default.', { path: this.configPath });
        await this.backupCorruptConfig();
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      let config;
      try {
        config = validateConfig(parsed);
      } catch (validationErr) {
        this.logger.error('Config file is corrupt (schema validation failed). Backing up and creating default.', { path: this.configPath });
        await this.backupCorruptConfig();
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      this.logger.log('Config loaded successfully', { path: this.configPath, encrypted: raw.startsWith('ENCRYPTED_v1') });
      return { ok: true, value: config };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.warn('Config file not found. Creating default config.', { path: this.configPath });
        const defaults = getDefaultConfig();
        await this.save(defaults);
        return { ok: true, value: defaults };
      }
      this.logger.error('Failed to load config', { error: err.message, path: this.configPath });
      return { ok: false, error: new ConfigError(err.message) };
    }
  }

  async save(config: Config): Promise<Result<void>> {
    try {
      await this.ensureDir();
      this.logger.debug('Attempting to save config', { path: this.configPath });
      const validated = validateConfig(config);
      let data = JSON.stringify(validated, null, 2);
      let encrypted = false;
      if (config.encryption?.enabled && config.encryption.encryptionKey) {
        this.logger.log('Encrypting config before save', { path: this.configPath });
        const encResult = await this.encryption.encrypt(data, config.encryption.encryptionKey);
        if (isFailure(encResult)) {
          this.logger.error('Encryption failed', { error: encResult.error });
          return { ok: false, error: encResult.error };
        }
        data = encResult.value;
        encrypted = true;
      }
      // Write to temp file
      const tempPath = this.configPath + TEMP_SUFFIX;
      await fs.writeFile(tempPath, data, { encoding: 'utf8', mode: 0o600 });
      this.logger.debug('Temp config file written', { tempPath });
      await fs.rename(this.configPath, this.configPath + BACKUP_SUFFIX).then(() => {
        this.logger.log('Config backup created', { backupPath: this.configPath + BACKUP_SUFFIX });
      }).catch(() => {}); // backup old
      await fs.rename(tempPath, this.configPath); // atomic replace
      this.logger.log('Config saved successfully', { path: this.configPath, encrypted });
      return { ok: true, value: undefined };
    } catch (err: any) {
      this.logger.error('Failed to save config', { error: err.message, path: this.configPath });
      return { ok: false, error: new ConfigError(err.message) };
    }
  }

  private async ensureDir() {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 }).then(() => {
      this.logger.debug('Ensured config directory exists', { dir });
    }).catch(() => {});
  }

  private async backupCorruptConfig() {
    try {
      const backupPath = this.configPath + '.bak.' + Date.now();
      await fs.rename(this.configPath, backupPath);
      this.logger.warn('Backed up corrupt config file', { backupPath });
    } catch (err: any) {
      this.logger.error('Failed to backup corrupt config file', { error: err.message });
    }
  }
} 