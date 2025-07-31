import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { IStorageService } from '@codestate/core/domain/ports/IStorageService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import { ErrorCode, StorageError, EncryptionError } from '@codestate/core/domain/types/ErrorTypes';

// Mock dependencies
const mockLoggerService: jest.Mocked<ILoggerService> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  plainLog: jest.fn()
};

const mockEncryptionService: jest.Mocked<IEncryptionService> = {
  encrypt: jest.fn(),
  decrypt: jest.fn()
};

// Mock fs
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockAccess = jest.fn();
const mockMkdir = jest.fn();
const mockCopyFile = jest.fn();
const mockUnlink = jest.fn();
const mockRename = jest.fn();
const mockOpen = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  access: mockAccess,
  mkdir: mockMkdir,
  copyFile: mockCopyFile,
  unlink: mockUnlink,
  rename: mockRename,
  open: mockOpen
}));

describe('FileStorage', () => {
  let fileStorage: FileStorage;
  const mockConfig = {
    encryptionEnabled: false,
    dataDir: '/test/data'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fileStorage = new FileStorage(mockLoggerService, mockEncryptionService, mockConfig);
  });

  describe('Happy Path Tests', () => {
    it('should read file successfully', async () => {
      const filePath = 'test.txt';
      const fileContent = 'Hello, World!';

      mockReadFile.mockResolvedValue(fileContent);

      const result = await fileStorage.read(filePath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(fileContent);
      }
      expect(mockReadFile).toHaveBeenCalledWith('/test/data/test.txt', 'utf8');
    });

    it('should write file successfully', async () => {
      const filePath = 'test.txt';
      const fileContent = 'Hello, World!';

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockOpen.mockResolvedValue({
        sync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      });
      mockAccess.mockRejectedValue(new Error('File not found'));
      mockRename.mockResolvedValue(undefined);

      const result = await fileStorage.write(filePath, fileContent);

      expect(result.ok).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith('/test/data/test.txt.tmp', fileContent, { mode: 0o600 });
    });

    it('should check if file exists successfully', async () => {
      const filePath = 'test.txt';

      mockAccess.mockResolvedValue(undefined);

      const result = await fileStorage.exists(filePath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockAccess).toHaveBeenCalledWith('/test/data/test.txt', expect.any(Number));
    });

    it('should return false when file does not exist', async () => {
      const filePath = 'nonexistent.txt';

      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await fileStorage.exists(filePath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it('should delete file successfully', async () => {
      const filePath = 'test.txt';

      mockCopyFile.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      const result = await fileStorage.delete(filePath);

      expect(result.ok).toBe(true);
      expect(mockUnlink).toHaveBeenCalledWith('/test/data/test.txt');
    });

    it('should handle encrypted files', async () => {
      const filePath = 'encrypted.txt';
      const encryptedContent = 'encrypted-data';
      const decryptedContent = 'decrypted-data';

      const encryptedConfig = {
        encryptionEnabled: true,
        encryptionKey: 'test-key',
        dataDir: '/test/data'
      };

      const encryptedFileStorage = new FileStorage(mockLoggerService, mockEncryptionService, encryptedConfig);

      mockReadFile.mockResolvedValue(encryptedContent);
      mockEncryptionService.decrypt.mockResolvedValue({
        ok: true,
        value: decryptedContent
      });

      const result = await encryptedFileStorage.read(filePath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(decryptedContent);
      }
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(encryptedContent, 'test-key');
    });

    it('should handle writing encrypted files', async () => {
      const filePath = 'encrypted.txt';
      const content = 'sensitive-data';
      const encryptedContent = 'encrypted-data';

      const encryptedConfig = {
        encryptionEnabled: true,
        encryptionKey: 'test-key',
        dataDir: '/test/data'
      };

      const encryptedFileStorage = new FileStorage(mockLoggerService, mockEncryptionService, encryptedConfig);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockOpen.mockResolvedValue({
        sync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      });
      mockAccess.mockRejectedValue(new Error('File not found'));
      mockRename.mockResolvedValue(undefined);
      mockEncryptionService.encrypt.mockResolvedValue({
        ok: true,
        value: encryptedContent
      });

      const result = await encryptedFileStorage.write(filePath, content);

      expect(result.ok).toBe(true);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(content, 'test-key');
      expect(mockWriteFile).toHaveBeenCalledWith('/test/data/encrypted.txt.tmp', encryptedContent, { mode: 0o600 });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle file not found error', async () => {
      const filePath = 'nonexistent.txt';
      const error = new Error('ENOENT: no such file or directory');

      mockReadFile.mockRejectedValue(error);

      const result = await fileStorage.read(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_READ_FAILED);
      }
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle permission denied error', async () => {
      const filePath = 'protected.txt';
      const error = new Error('EACCES: permission denied');

      mockReadFile.mockRejectedValue(error);

      const result = await fileStorage.read(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_READ_FAILED);
      }
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle write failure', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      const error = new Error('ENOSPC: no space left on device');

      mockMkdir.mockRejectedValue(error);

      const result = await fileStorage.write(filePath, content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_WRITE_FAILED);
      }
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle delete failure', async () => {
      const filePath = 'test.txt';
      const error = new Error('ENOENT: no such file or directory');

      mockUnlink.mockRejectedValue(error);

      const result = await fileStorage.delete(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_DELETE_FAILED);
      }
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle path traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';

      const result = await fileStorage.read(maliciousPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_INVALID_PATH);
      }
    });

    it('should handle encryption failure during read', async () => {
      const filePath = 'encrypted.txt';
      const encryptedContent = 'encrypted-data';

      const encryptedConfig = {
        encryptionEnabled: true,
        encryptionKey: 'test-key',
        dataDir: '/test/data'
      };

      const encryptedFileStorage = new FileStorage(mockLoggerService, mockEncryptionService, encryptedConfig);

      mockReadFile.mockResolvedValue(encryptedContent);
      mockEncryptionService.decrypt.mockResolvedValue({
        ok: false,
        error: new EncryptionError('Decryption failed', ErrorCode.STORAGE_DECRYPTION_FAILED)
      });

      const result = await encryptedFileStorage.read(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_DECRYPTION_FAILED);
      }
    });

    it('should handle encryption failure during write', async () => {
      const filePath = 'encrypted.txt';
      const content = 'sensitive-data';

      const encryptedConfig = {
        encryptionEnabled: true,
        encryptionKey: 'test-key',
        dataDir: '/test/data'
      };

      const encryptedFileStorage = new FileStorage(mockLoggerService, mockEncryptionService, encryptedConfig);

      mockEncryptionService.encrypt.mockResolvedValue({
        ok: false,
        error: new EncryptionError('Encryption failed', ErrorCode.ENCRYPTION_FAILED)
      });

      const result = await encryptedFileStorage.write(filePath, content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_WRITE_FAILED);
      }
    });
  });

  describe('Path Validation Tests', () => {
    it('should handle null file path', async () => {
      const result = await fileStorage.read(null as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_INVALID_PATH);
      }
    });

    it('should handle undefined file path', async () => {
      const result = await fileStorage.read(undefined as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_INVALID_PATH);
      }
    });

    it('should handle empty file path', async () => {
      const result = await fileStorage.read('');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_INVALID_PATH);
      }
    });

    it('should handle absolute paths outside data directory', async () => {
      const result = await fileStorage.read('/absolute/path/outside/data/dir');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ErrorCode.STORAGE_INVALID_PATH);
      }
    });
  });

  describe('Method Tests', () => {
    it('should have read method', () => {
      expect(typeof fileStorage.read).toBe('function');
    });

    it('should have write method', () => {
      expect(typeof fileStorage.write).toBe('function');
    });

    it('should have exists method', () => {
      expect(typeof fileStorage.exists).toBe('function');
    });

    it('should have delete method', () => {
      expect(typeof fileStorage.delete).toBe('function');
    });

    it('should implement IStorageService interface', () => {
      expect(fileStorage).toHaveProperty('read');
      expect(fileStorage).toHaveProperty('write');
      expect(fileStorage).toHaveProperty('exists');
      expect(fileStorage).toHaveProperty('delete');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full file workflow', async () => {
      const filePath = 'test.txt';
      const content = 'Hello, World!';

      // Write file
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockOpen.mockResolvedValue({
        sync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      });
      mockAccess.mockRejectedValue(new Error('File not found'));
      mockRename.mockResolvedValue(undefined);

      const writeResult = await fileStorage.write(filePath, content);
      expect(writeResult.ok).toBe(true);

      // Check if file exists
      mockAccess.mockResolvedValue(undefined);

      const existsResult = await fileStorage.exists(filePath);
      expect(existsResult.ok).toBe(true);
      if (existsResult.ok) {
        expect(existsResult.value).toBe(true);
      }

      // Read file
      mockReadFile.mockResolvedValue(content);

      const readResult = await fileStorage.read(filePath);
      expect(readResult.ok).toBe(true);
      if (readResult.ok) {
        expect(readResult.value).toBe(content);
      }

      // Delete file
      mockCopyFile.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      const deleteResult = await fileStorage.delete(filePath);
      expect(deleteResult.ok).toBe(true);
    });

    it('should handle multiple file operations', async () => {
      const files = [
        { path: 'file1.txt', content: 'Content 1' },
        { path: 'file2.txt', content: 'Content 2' },
        { path: 'file3.txt', content: 'Content 3' }
      ];

      // Write multiple files
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockOpen.mockResolvedValue({
        sync: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      });
      mockAccess.mockRejectedValue(new Error('File not found'));
      mockRename.mockResolvedValue(undefined);

      const writeResults = await Promise.all(
        files.map(file => fileStorage.write(file.path, file.content))
      );

      expect(writeResults.every(result => result.ok)).toBe(true);

      // Read multiple files
      files.forEach((file, index) => {
        mockReadFile.mockResolvedValueOnce(file.content);
      });

      const readResults = await Promise.all(
        files.map(file => fileStorage.read(file.path))
      );

      expect(readResults.every(result => result.ok)).toBe(true);
      if (readResults[0].ok) {
        expect(readResults[0].value).toBe('Content 1');
      }
      if (readResults[1].ok) {
        expect(readResults[1].value).toBe('Content 2');
      }
      if (readResults[2].ok) {
        expect(readResults[2].value).toBe('Content 3');
      }
    });
  });
}); 