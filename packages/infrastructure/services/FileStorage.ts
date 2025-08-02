import { IStorageService } from '../../core/domain/ports/IStorageService';
import { ILoggerService } from '../../core/domain/ports/ILoggerService';
import { IEncryptionService } from '../../core/domain/ports/IEncryptionService';
import { StorageError, ErrorCode } from '../../core/domain/types/ErrorTypes';
import { Result, isFailure } from '../../core/domain/models/Result';
import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import { validateFileStorageConfig } from '../../core/domain/schemas/SchemaRegistry';

interface FileStorageConfig {
  encryptionEnabled: boolean;
  encryptionKey?: string;
  dataDir: string;
}

export class FileStorage implements IStorageService {
  private config: FileStorageConfig;

  constructor(
    private logger: ILoggerService,
    private encryption: IEncryptionService,
    config: unknown
  ) {
    this.config = validateFileStorageConfig(config);
  }

  private resolvePath(relPath: string): string {
    // Prevent path traversal
    const fullPath = path.resolve(this.config.dataDir, relPath);
    if (!fullPath.startsWith(path.resolve(this.config.dataDir))) {
      throw new StorageError('Invalid file path', ErrorCode.STORAGE_INVALID_PATH, { relPath });
    }
    return fullPath;
  }

  async read(relPath: string): Promise<Result<string, StorageError>> {
    const filePath = this.resolvePath(relPath);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      this.logger.debug('File read', { filePath });
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        const decrypted = await this.encryption.decrypt(data, this.config.encryptionKey);
        if (isFailure(decrypted)) {
          this.logger.error('Decryption failed during read', { filePath });
          return { ok: false, error: new StorageError('Decryption failed', ErrorCode.STORAGE_DECRYPTION_FAILED, { filePath }) };
        }
        return { ok: true, value: decrypted.value };
      }
      return { ok: true, value: data };
    } catch (err) {
      this.logger.error('File read failed', { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError('File read failed', ErrorCode.STORAGE_READ_FAILED, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }

  async write(relPath: string, data: string): Promise<Result<void, StorageError>> {
    const filePath = this.resolvePath(relPath);
    const dir = path.dirname(filePath);
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });
      let toWrite = data;
      if (this.config.encryptionEnabled && this.config.encryptionKey) {
        const encrypted = await this.encryption.encrypt(data, this.config.encryptionKey);
        if (isFailure(encrypted)) {
          this.logger.error('Encryption failed during write', { filePath });
          return { ok: false, error: new StorageError('Encryption failed', ErrorCode.STORAGE_WRITE_FAILED, { filePath }) };
        }
        toWrite = encrypted.value;
      }
      const tmpPath = filePath + '.tmp';
      await fs.writeFile(tmpPath, toWrite, { mode: 0o600 });
      const handle = await fs.open(tmpPath, 'r+');
      await handle.sync();
      await handle.close();
      // Backup old file if exists
      try {
        await fs.access(filePath, fsConstants.F_OK);
        await fs.copyFile(filePath, filePath + '.bak');
      } catch {}
      await fs.rename(tmpPath, filePath);
      this.logger.debug('File written atomically', { filePath });
      return { ok: true, value: undefined };
    } catch (err) {
      this.logger.error('File write failed', { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError('File write failed', ErrorCode.STORAGE_WRITE_FAILED, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }

  async exists(relPath: string): Promise<Result<boolean, StorageError>> {
    const filePath = this.resolvePath(relPath);
    try {
      await fs.access(filePath, fsConstants.F_OK);
      this.logger.debug('File exists', { filePath });
      return { ok: true, value: true };
    } catch {
      return { ok: true, value: false };
    }
  }

  async delete(relPath: string): Promise<Result<void, StorageError>> {
    const filePath = this.resolvePath(relPath);
    try {
      // Backup before delete
      try {
        await fs.copyFile(filePath, filePath + '.bak');
      } catch {}
      await fs.unlink(filePath);
      this.logger.debug('File deleted', { filePath });
      return { ok: true, value: undefined };
    } catch (err) {
      this.logger.error('File delete failed', { filePath, error: err instanceof Error ? err.message : err });
      return { ok: false, error: new StorageError('File delete failed', ErrorCode.STORAGE_DELETE_FAILED, { filePath, originalError: err instanceof Error ? err.message : err }) };
    }
  }
} 