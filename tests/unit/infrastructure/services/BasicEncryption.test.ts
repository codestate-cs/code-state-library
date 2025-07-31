import { BasicEncryption } from '@codestate/infrastructure/services/BasicEncryption';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { EncryptionError, ErrorCode } from '@codestate/core/domain/types/ErrorTypes';

// Mock crypto
const mockRandomBytes = jest.fn();
const mockPbkdf2Sync = jest.fn();
const mockCreateCipheriv = jest.fn();
const mockCreateDecipheriv = jest.fn();

jest.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
  pbkdf2Sync: mockPbkdf2Sync,
  createCipheriv: mockCreateCipheriv,
  createDecipheriv: mockCreateDecipheriv
}));

describe('BasicEncryption', () => {
  let basicEncryption: BasicEncryption;
  let mockLogger: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    basicEncryption = new BasicEncryption(mockLogger);
  });

  describe('Happy Path Tests', () => {
    it('should encrypt data successfully', async () => {
      const data = 'Hello, World!';
      const key = 'test-key-123';
      const salt = Buffer.from('test-salt-123456');
      const iv = Buffer.from('test-iv-123456');
      const derivedKey = Buffer.from('derived-key-32-bytes-long-key');
      const ciphertext = Buffer.from('encrypted-data');
      const authTag = Buffer.from('auth-tag-16-bytes');

      mockRandomBytes
        .mockReturnValueOnce(salt)
        .mockReturnValueOnce(iv);
      mockPbkdf2Sync.mockReturnValue(derivedKey);
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(authTag)
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, key);

      expect(result.ok).toBe(true);
      expect(result.value).toMatch(/^ENCRYPTED_v1:/);
      expect(mockLogger.debug).toHaveBeenCalledWith('Data encrypted', {
        algorithm: 'AES-256-GCM',
        operation: 'encrypt'
      });
    });

    it('should decrypt data successfully', async () => {
      const key = 'test-key-123';
      const salt = Buffer.from('test-salt-123456');
      const iv = Buffer.from('test-iv-123456');
      const ciphertext = Buffer.from('encrypted-data');
      const authTag = Buffer.from('auth-tag-16-bytes');
      const derivedKey = Buffer.from('derived-key-32-bytes-long-key');
      const originalData = 'Hello, World!';

      const encryptedData = `ENCRYPTED_v1:${iv.toString('base64')}:${salt.toString('base64')}:${ciphertext.toString('base64')}:${authTag.toString('base64')}`;

      mockPbkdf2Sync.mockReturnValue(derivedKey);
      
      const mockDecipher = {
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from(originalData))
      };
      mockCreateDecipheriv.mockReturnValue(mockDecipher);

      const result = await basicEncryption.decrypt(encryptedData, key);

      expect(result.ok).toBe(true);
      expect(result.value).toBe(originalData);
      expect(mockLogger.debug).toHaveBeenCalledWith('Data decrypted', {
        algorithm: 'AES-256-GCM',
        operation: 'decrypt'
      });
    });

    it('should handle empty data', async () => {
      const data = '';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('')),
        final: jest.fn().mockReturnValue(Buffer.from('')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, key);

      expect(result.ok).toBe(true);
      expect(result.value).toMatch(/^ENCRYPTED_v1:/);
    });

    it('should handle large data', async () => {
      const data = 'a'.repeat(10000);
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, key);

      expect(result.ok).toBe(true);
    });

    it('should handle unicode data', async () => {
      const data = '测试中文 🚀 emoji: 测试';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, key);

      expect(result.ok).toBe(true);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null data for encryption', async () => {
      const result = await basicEncryption.encrypt(null as any, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle undefined data for encryption', async () => {
      const result = await basicEncryption.encrypt(undefined as any, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle null key for encryption', async () => {
      const result = await basicEncryption.encrypt('data', null as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle undefined key for encryption', async () => {
      const result = await basicEncryption.encrypt('data', undefined as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle empty key for encryption', async () => {
      const result = await basicEncryption.encrypt('data', '');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle null data for decryption', async () => {
      const result = await basicEncryption.decrypt(null as any, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle undefined data for decryption', async () => {
      const result = await basicEncryption.decrypt(undefined as any, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle null key for decryption', async () => {
      const result = await basicEncryption.decrypt('data', null as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle undefined key for decryption', async () => {
      const result = await basicEncryption.decrypt('data', undefined as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle empty key for decryption', async () => {
      const result = await basicEncryption.decrypt('data', '');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });
  });

  describe('Failure Tests', () => {
    it('should handle encryption errors', async () => {
      const error = new Error('Encryption failed');
      mockRandomBytes.mockImplementation(() => {
        throw error;
      });

      const result = await basicEncryption.encrypt('data', 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
      expect(result.error?.code).toBe(ErrorCode.ENCRYPTION_FAILED);
      expect(mockLogger.error).toHaveBeenCalledWith('Encryption failed', {
        error: 'Encryption failed',
        operation: 'encrypt'
      });
    });

    it('should handle decryption errors', async () => {
      const error = new Error('Decryption failed');
      mockCreateDecipheriv.mockImplementation(() => {
        throw error;
      });

      const encryptedData = 'ENCRYPTED_v1:base64:base64:base64:base64';

      const result = await basicEncryption.decrypt(encryptedData, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
      expect(result.error?.code).toBe(ErrorCode.ENCRYPTION_FAILED);
      expect(mockLogger.error).toHaveBeenCalledWith('Decryption failed', {
        error: 'Decryption failed',
        operation: 'decrypt'
      });
    });

    it('should handle invalid encrypted data format', async () => {
      const invalidData = 'INVALID_FORMAT:data';

      const result = await basicEncryption.decrypt(invalidData, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
      expect(result.error?.code).toBe(ErrorCode.ENCRYPTION_INVALID_FORMAT);
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid encrypted data format', {
        operation: 'decrypt'
      });
    });

    it('should handle malformed encrypted data', async () => {
      const malformedData = 'ENCRYPTED_v1:invalid:data';

      const result = await basicEncryption.decrypt(malformedData, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle base64 decoding errors', async () => {
      const invalidBase64Data = 'ENCRYPTED_v1:invalid-base64:invalid-base64:invalid-base64:invalid-base64';

      const result = await basicEncryption.decrypt(invalidBase64Data, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle cipher creation errors', async () => {
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      mockCreateCipheriv.mockImplementation(() => {
        throw new Error('Cipher creation failed');
      });

      const result = await basicEncryption.encrypt('data', 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });

    it('should handle decipher creation errors', async () => {
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      mockCreateDecipheriv.mockImplementation(() => {
        throw new Error('Decipher creation failed');
      });

      const encryptedData = 'ENCRYPTED_v1:base64:base64:base64:base64';

      const result = await basicEncryption.decrypt(encryptedData, 'key');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(EncryptionError);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large data', async () => {
      const largeData = 'a'.repeat(1000000);
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(largeData, key);

      expect(result.ok).toBe(true);
    });

    it('should handle extremely long keys', async () => {
      const data = 'test data';
      const longKey = 'a'.repeat(10000);

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, longKey);

      expect(result.ok).toBe(true);
    });

    it('should handle binary data', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]).toString('utf8');
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(binaryData, key);

      expect(result.ok).toBe(true);
    });

    it('should handle concurrent encryption operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        mockRandomBytes
          .mockReturnValueOnce(Buffer.from(`salt-${i}`))
          .mockReturnValueOnce(Buffer.from(`iv-${i}`));
        mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
        
        const mockCipher = {
          update: jest.fn().mockReturnValue(Buffer.from('partial')),
          final: jest.fn().mockReturnValue(Buffer.from('final')),
          getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
        };
        mockCreateCipheriv.mockReturnValue(mockCipher);

        return basicEncryption.encrypt(`data-${i}`, 'key');
      });

      const results = await Promise.all(promises);
      expect(results.every(result => result.ok)).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in encrypted data', async () => {
      const typos = [
        'ENCRYPTED_v2:data',
        'ENCRYPTED_v1:data',
        'ENCRYPTED:data',
        'ENCRYPTED_v1:data:data',
        'ENCRYPTED_v1:data:data:data:data:extra'
      ];

      typos.forEach(data => {
        const result = basicEncryption.decrypt(data, 'key');
        expect(result).resolves.toMatchObject({
          ok: false,
          error: expect.objectContaining({
            code: ErrorCode.ENCRYPTION_INVALID_FORMAT
          })
        });
      });
    });

    it('should handle wrong parameter types', async () => {
      const wrongTypes = [
        { data: 123, key: 'key' },
        { data: 'data', key: 456 },
        { data: [], key: 'key' },
        { data: 'data', key: {} }
      ];

      wrongTypes.forEach(({ data, key }) => {
        const encryptResult = basicEncryption.encrypt(data as any, key as any);
        expect(encryptResult).resolves.toMatchObject({
          ok: false,
          error: expect.objectContaining({
            code: ErrorCode.ENCRYPTION_FAILED
          })
        });
      });
    });

    it('should handle case sensitivity in encrypted data', async () => {
      const caseVariations = [
        'encrypted_v1:data',
        'ENCRYPTED_V1:data',
        'Encrypted_v1:data'
      ];

      caseVariations.forEach(data => {
        const result = basicEncryption.decrypt(data, 'key');
        expect(result).resolves.toMatchObject({
          ok: false,
          error: expect.objectContaining({
            code: ErrorCode.ENCRYPTION_INVALID_FORMAT
          })
        });
      });
    });

    it('should handle extra whitespace in encrypted data', async () => {
      const whitespaceData = ' ENCRYPTED_v1:data ';

      const result = await basicEncryption.decrypt(whitespaceData, 'key');

      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.ENCRYPTION_INVALID_FORMAT);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle null bytes in data', async () => {
      const dataWithNullBytes = 'data\x00with\x00null\x00bytes';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(dataWithNullBytes, key);

      expect(result.ok).toBe(true);
    });

    it('should handle control characters in data', async () => {
      const dataWithControl = 'data\x01\x02\x03with\x04\x05\x06control';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(dataWithControl, key);

      expect(result.ok).toBe(true);
    });

    it('should handle script injection in data', async () => {
      const scriptData = '<script>alert("xss")</script>';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(scriptData, key);

      expect(result.ok).toBe(true);
    });

    it('should handle SQL injection in data', async () => {
      const sqlData = '; DROP TABLE users; --';
      const key = 'test-key';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(sqlData, key);

      expect(result.ok).toBe(true);
    });

    it('should handle command injection in key', async () => {
      const data = 'test data';
      const maliciousKey = '$(rm -rf /)';

      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const result = await basicEncryption.encrypt(data, maliciousKey);

      expect(result.ok).toBe(true);
    });
  });

  describe('Method Tests', () => {
    it('should have encrypt method', () => {
      expect(typeof basicEncryption.encrypt).toBe('function');
    });

    it('should have decrypt method', () => {
      expect(typeof basicEncryption.decrypt).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle encrypt-decrypt round trip', async () => {
      const originalData = 'Hello, World!';
      const key = 'test-key-123';

      // Mock encryption
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt'))
        .mockReturnValueOnce(Buffer.from('iv'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher = {
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from('final')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher);

      const encryptResult = await basicEncryption.encrypt(originalData, key);
      expect(encryptResult.ok).toBe(true);

      // Mock decryption
      const mockDecipher = {
        setAuthTag: jest.fn(),
        update: jest.fn().mockReturnValue(Buffer.from('partial')),
        final: jest.fn().mockReturnValue(Buffer.from(originalData))
      };
      mockCreateDecipheriv.mockReturnValue(mockDecipher);

      const decryptResult = await basicEncryption.decrypt(encryptResult.value!, key);
      expect(decryptResult.ok).toBe(true);
      expect(decryptResult.value).toBe(originalData);
    });

    it('should handle multiple encryption operations', async () => {
      const data1 = 'Data 1';
      const data2 = 'Data 2';
      const key = 'test-key';

      // Mock for first encryption
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt1'))
        .mockReturnValueOnce(Buffer.from('iv1'));
      mockPbkdf2Sync.mockReturnValue(Buffer.from('key'));
      
      const mockCipher1 = {
        update: jest.fn().mockReturnValue(Buffer.from('partial1')),
        final: jest.fn().mockReturnValue(Buffer.from('final1')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag1'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher1);

      const result1 = await basicEncryption.encrypt(data1, key);
      expect(result1.ok).toBe(true);

      // Mock for second encryption
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from('salt2'))
        .mockReturnValueOnce(Buffer.from('iv2'));
      
      const mockCipher2 = {
        update: jest.fn().mockReturnValue(Buffer.from('partial2')),
        final: jest.fn().mockReturnValue(Buffer.from('final2')),
        getAuthTag: jest.fn().mockReturnValue(Buffer.from('tag2'))
      };
      mockCreateCipheriv.mockReturnValue(mockCipher2);

      const result2 = await basicEncryption.encrypt(data2, key);
      expect(result2.ok).toBe(true);

      // Results should be different due to different random values
      expect(result1.value).not.toBe(result2.value);
    });
  });
}); 