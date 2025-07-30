import { IEncryptionService } from '../../core/domain/ports/IEncryptionService';
import { EncryptionError, ErrorCode } from '../../core/domain/types/ErrorTypes';
import { ILoggerService } from '../../core/domain/ports/ILoggerService';
import { Result } from '../../core/domain/models/Result';
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto';

const HEADER = 'ENCRYPTED_v1';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32; // 256 bits
const PBKDF2_ITER = 100_000;

export class BasicEncryption implements IEncryptionService {
  constructor(private logger: ILoggerService) {}

  async encrypt(data: string, key: string): Promise<Result<string, EncryptionError>> {
    try {
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);
      const derivedKey = pbkdf2Sync(key, salt, PBKDF2_ITER, KEY_LENGTH, 'sha512');
      const cipher = createCipheriv('aes-256-gcm', derivedKey, iv);
      const ciphertext = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      this.logger.debug('Data encrypted', { algorithm: 'AES-256-GCM', operation: 'encrypt' });
      return {
        ok: true,
        value: [
          HEADER,
          iv.toString('base64'),
          salt.toString('base64'),
          ciphertext.toString('base64'),
          authTag.toString('base64')
        ].join(':')
      };
    } catch (err) {
      this.logger.error('Encryption failed', { error: err instanceof Error ? err.message : err, operation: 'encrypt' });
      return { ok: false, error: new EncryptionError('Encryption failed', ErrorCode.ENCRYPTION_FAILED, { originalError: err instanceof Error ? err.message : err, operation: 'encrypt' }) };
    }
  }

  async decrypt(data: string, key: string): Promise<Result<string, EncryptionError>> {
    try {
      const parts = data.split(':');
      if (parts[0] !== HEADER || parts.length !== 5) {
        this.logger.error('Invalid encrypted data format', { operation: 'decrypt' });
        return { ok: false, error: new EncryptionError('Invalid encrypted data format', ErrorCode.ENCRYPTION_INVALID_FORMAT, { operation: 'decrypt' }) };
      }
      const [, ivB64, saltB64, ciphertextB64, authTagB64] = parts;
      const iv = Buffer.from(ivB64, 'base64');
      const salt = Buffer.from(saltB64, 'base64');
      const ciphertext = Buffer.from(ciphertextB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const derivedKey = pbkdf2Sync(key, salt, PBKDF2_ITER, KEY_LENGTH, 'sha512');
      const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ]);
      this.logger.debug('Data decrypted', { algorithm: 'AES-256-GCM', operation: 'decrypt' });
      return { ok: true, value: plaintext.toString('utf8') };
    } catch (err) {
      this.logger.error('Decryption failed', { error: err instanceof Error ? err.message : err, operation: 'decrypt' });
      return { ok: false, error: new EncryptionError('Decryption failed', ErrorCode.ENCRYPTION_FAILED, { originalError: err instanceof Error ? err.message : err, operation: 'decrypt' }) };
    }
  }
} 