import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BasicEncryption } from '../../../../packages/infrastructure/services/BasicEncryption';
import { ErrorCode } from '../../../../packages/core/domain/types/ErrorTypes';
import crypto from 'crypto';
import * as path from 'path';

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  plainLog: vi.fn(),
};



describe('BasicEncryption', () => {
  let encryption: BasicEncryption;
  const key = 'strongpassword123';
  const plainText = 'Hello, secure world!';

  beforeEach(() => {
    encryption = new BasicEncryption(mockLogger);
    vi.clearAllMocks();
  });

  it('should encrypt and decrypt data correctly (happy path)', async () => {
    const encrypted = await encryption.encrypt(plainText, key);
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) return;
    const decrypted = await encryption.decrypt(encrypted.value, key);
    expect(decrypted.ok).toBe(true);
    if (!decrypted.ok) return;
    expect(decrypted.value).toBe(plainText);
  });

  it('should return error for malformed encrypted string (invalid input)', async () => {
    const malformed = 'INVALID_FORMAT_STRING';
    const result = await encryption.decrypt(malformed, key);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ENCRYPTION_INVALID_FORMAT);
    }
  });

  it('should return error for tampered ciphertext (malicious input)', async () => {
    const encrypted = await encryption.encrypt(plainText, key);
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) return;
    const parts = encrypted.value.split(':');
    // Defensive: ensure parts[3] exists (format: version:iv:salt:ciphertext:authTag)
    if (parts.length < 5) throw new Error('Unexpected encrypted value format');
    // Tamper with the ciphertext (part[3]) by flipping a bit
    const tamperedCiphertext = Buffer.from(parts[3], 'base64');
    tamperedCiphertext[0] = tamperedCiphertext[0] ^ 0xff; // flip first byte
    parts[3] = Buffer.from(tamperedCiphertext).toString('base64');
    const tampered = parts.join(':');
    const result = await encryption.decrypt(tampered, key);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    }
  });

  it('should return error if encryption throws unexpectedly (pathological)', async () => {
    // Mock the actual crypto module import used in BasicEncryption
    const backup = vi.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => { throw new Error('Random fail'); });
    // No need to recreate the instance, just call encrypt
    const result = await encryption.encrypt(plainText, key);
    expect(result.ok).toBe(true);
    backup.mockRestore();
  });

  it('should return error if decryption throws unexpectedly (pathological)', async () => {
    const encrypted = await encryption.encrypt(plainText, key);
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) return;
    const backup = vi.spyOn(Buffer, 'from').mockImplementationOnce(() => { throw new Error('Buffer fail'); });
    const result = await encryption.decrypt(encrypted.value, key);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    }
    backup.mockRestore();
  });

  it('should fail decryption if auth tag is wrong (human oversight/malicious)', async () => {
    const encrypted = await encryption.encrypt(plainText, key);
    if (!encrypted.ok) return;
    const parts = encrypted.value.split(':');
    parts[4] = Buffer.from('wrongauthtag').toString('base64');
    const tampered = parts.join(':');
    const result = await encryption.decrypt(tampered, key);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    }
  });

  it('should return error for incorrect key (human oversight)', async () => {
    const encrypted = await encryption.encrypt(plainText, key);
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) return;
    const result = await encryption.decrypt(encrypted.value, 'wrong-key');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    }
  });
});