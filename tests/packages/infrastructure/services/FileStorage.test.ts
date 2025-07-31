import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileStorage } from '../../../../packages/infrastructure/services/FileStorage';
import { StorageError, ErrorCode } from '../../../../packages/core/domain/types/ErrorTypes';
import { Result } from '../../../../packages/core/domain/models/Result';
import * as fs from 'fs';
import * as path from 'path';

// Mocks
vi.mock('fs', async () => {
  const actualFs = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
      unlink: vi.fn(),
      rename: vi.fn(),
      copyFile: vi.fn(),
      open: vi.fn(() => ({
        sync: vi.fn(),
        close: vi.fn(),
      }))
    }
  };
});

const mockLogger = {
  debug: vi.fn(),
  error: vi.fn()
};

const mockEncryption = {
  encrypt: vi.fn(),
  decrypt: vi.fn()
};

const config = {
  encryptionEnabled: false,
  dataDir: '/tmp/data'
};

describe('FileStorage', () => {
  let fileStorage;

  beforeEach(() => {
    fileStorage = new FileStorage(mockLogger, mockEncryption, config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should read file contents (happy path)', async () => {
    fs.promises.readFile.mockResolvedValue('data');
    const result = await fileStorage.read('test.txt');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('data');
  });

  it('should handle read failure', async () => {
    fs.promises.readFile.mockRejectedValue(new Error('fail'));
    const result = await fileStorage.read('fail.txt');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ErrorCode.STORAGE_READ_FAILED);
  });

  it('should handle decryption failure', async () => {
    fileStorage = new FileStorage(mockLogger, mockEncryption, {
      encryptionEnabled: true,
      encryptionKey: 'key',
      dataDir: '/tmp/data'
    });
    fs.promises.readFile.mockResolvedValue('encrypted');
    mockEncryption.decrypt.mockResolvedValue({ ok: false });
    const result = await fileStorage.read('secure.txt');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ErrorCode.STORAGE_DECRYPTION_FAILED);
  });

  it('should write file contents (happy path)', async () => {
    fs.promises.writeFile.mockResolvedValue(undefined);
    fs.promises.mkdir.mockResolvedValue(undefined);
    fs.promises.rename.mockResolvedValue(undefined);
    fs.promises.access.mockRejectedValueOnce(new Error('no file'));
    const result = await fileStorage.write('write.txt', 'content');
    expect(result.ok).toBe(true);
  });

  it('should fail writing if encryption fails', async () => {
    fileStorage = new FileStorage(mockLogger, mockEncryption, {
      encryptionEnabled: true,
      encryptionKey: 'key',
      dataDir: '/tmp/data'
    });
    mockEncryption.encrypt.mockResolvedValue({ ok: false });
    const result = await fileStorage.write('fail.txt', 'content');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ErrorCode.STORAGE_WRITE_FAILED);
  });

  it('should handle write failure', async () => {
    fs.promises.mkdir.mockResolvedValue(undefined);
    fs.promises.writeFile.mockRejectedValue(new Error('fail'));
    const result = await fileStorage.write('write.txt', 'data');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ErrorCode.STORAGE_WRITE_FAILED);
  });

  it('should return true if file exists', async () => {
    fs.promises.access.mockResolvedValue(undefined);
    const result = await fileStorage.exists('exists.txt');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return false if file does not exist', async () => {
    fs.promises.access.mockRejectedValue(new Error('not found'));
    const result = await fileStorage.exists('missing.txt');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(false);
  });

  it('should delete file (happy path)', async () => {
    fs.promises.copyFile.mockResolvedValue(undefined);
    fs.promises.unlink.mockResolvedValue(undefined);
    const result = await fileStorage.delete('delete.txt');
    expect(result.ok).toBe(true);
  });

  it('should handle delete failure', async () => {
    fs.promises.unlink.mockRejectedValue(new Error('fail'));
    const result = await fileStorage.delete('fail.txt');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(ErrorCode.STORAGE_DELETE_FAILED);
  });

  it('should throw error on path traversal attempt', async () => {
    expect(() => fileStorage['resolvePath']('../etc/passwd')).toThrow(StorageError);
  });
});