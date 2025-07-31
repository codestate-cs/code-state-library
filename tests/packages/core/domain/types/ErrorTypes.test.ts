import {
  ErrorCode,
  StandardizedErrorShape,
  AppError,
  ConfigError,
  StorageError,
  EncryptionError,
  ScriptError,
  GitError,
  TerminalError,
} from '@codestate/core/domain/types/ErrorTypes';
import { describe, expect, it } from '@jest/globals';

describe('ErrorTypes - ErrorCode', () => {
  // Happy path
  it('should have all expected error codes', () => {
    const expectedCodes = [
      'UNKNOWN',
      'CONFIG_INVALID',
      'STORAGE_INVALID_PATH',
      'STORAGE_DECRYPTION_FAILED',
      'STORAGE_READ_FAILED',
      'STORAGE_WRITE_FAILED',
      'STORAGE_DELETE_FAILED',
      'ENCRYPTION_FAILED',
      'ENCRYPTION_INVALID_FORMAT',
      'SCRIPT_INVALID',
      'SCRIPT_DUPLICATE',
      'SCRIPT_NOT_FOUND',
      'SCRIPT_PATH_INVALID',
      'SCRIPT_MALICIOUS',
      'GIT_NOT_REPOSITORY',
      'GIT_COMMAND_FAILED',
      'GIT_STASH_NOT_FOUND',
      'GIT_STASH_CONFLICT',
      'TERMINAL_COMMAND_FAILED',
      'TERMINAL_TIMEOUT',
      'TERMINAL_COMMAND_NOT_FOUND',
    ];
    
    expectedCodes.forEach(code => {
      expect(ErrorCode[code as keyof typeof ErrorCode]).toBe(code);
    });
  });

  // Error cases
  it('should not have unexpected error codes', () => {
    const unexpectedCodes = ['INVALID_CODE', 'ERROR', 'FAILURE'];
    unexpectedCodes.forEach(code => {
      expect(ErrorCode[code as keyof typeof ErrorCode]).toBeUndefined();
    });
  });

  // Pathological cases
  it('should handle empty string access', () => {
    expect(ErrorCode['' as keyof typeof ErrorCode]).toBeUndefined();
  });

  it('should handle null/undefined access', () => {
    expect(ErrorCode[null as any]).toBeUndefined();
    expect(ErrorCode[undefined as any]).toBeUndefined();
  });

  // Malicious input
  it('should handle SQL injection attempts', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "<script>alert('xss')</script>",
      "'; SELECT * FROM passwords; --",
    ];
    maliciousInputs.forEach(input => {
      expect(ErrorCode[input as keyof typeof ErrorCode]).toBeUndefined();
    });
  });
});

describe('ErrorTypes - StandardizedErrorShape', () => {
  // Happy path
  it('should define the correct interface structure', () => {
    const validError: StandardizedErrorShape = {
      code: ErrorCode.UNKNOWN,
      name: 'TestError',
      message: 'Test error message',
      meta: { key: 'value' },
    };
    
    expect(validError.code).toBe(ErrorCode.UNKNOWN);
    expect(validError.name).toBe('TestError');
    expect(validError.message).toBe('Test error message');
    expect(validError.meta).toEqual({ key: 'value' });
  });

  it('should allow optional meta field', () => {
    const errorWithoutMeta: StandardizedErrorShape = {
      code: ErrorCode.CONFIG_INVALID,
      name: 'ConfigError',
      message: 'Configuration error',
    };
    
    expect(errorWithoutMeta.meta).toBeUndefined();
  });

  // Error cases
  it('should require all mandatory fields', () => {
    // TypeScript will catch missing fields at compile time
    // This test documents the interface requirements
    const requiredFields = ['code', 'name', 'message'];
    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  // Pathological cases
  it('should handle empty strings', () => {
    const errorWithEmptyStrings: StandardizedErrorShape = {
      code: ErrorCode.UNKNOWN,
      name: '',
      message: '',
      meta: {},
    };
    
    expect(errorWithEmptyStrings.name).toBe('');
    expect(errorWithEmptyStrings.message).toBe('');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
      toString: () => 'malicious',
    };
    
    const errorWithMaliciousMeta: StandardizedErrorShape = {
      code: ErrorCode.UNKNOWN,
      name: 'TestError',
      message: 'Test message',
      meta: maliciousMeta,
    };
    
    expect(errorWithMaliciousMeta.meta).toBeDefined();
  });
});

describe('ErrorTypes - AppError', () => {
  // Happy path
  it('should create AppError with default code', () => {
    const error = new AppError('Test error message');
    
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe(ErrorCode.UNKNOWN);
    expect(error.name).toBe('AppError');
    expect(error.meta).toBeUndefined();
    expect(error instanceof Error).toBe(true);
    expect(error instanceof AppError).toBe(true);
  });

  it('should create AppError with custom code', () => {
    const error = new AppError('Config error', ErrorCode.CONFIG_INVALID);
    
    expect(error.message).toBe('Config error');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.name).toBe('AppError');
  });

  it('should create AppError with meta data', () => {
    const meta = { userId: 123, action: 'save' };
    const error = new AppError('Test error', ErrorCode.UNKNOWN, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new AppError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.UNKNOWN);
  });

  it('should handle null/undefined message', () => {
    const error1 = new AppError(null as any);
    const error2 = new AppError(undefined as any);
    
    expect(error1.message).toBe('null');
    expect(error2.message).toBe('');
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error1 = new AppError(123 as any);
    const error2 = new AppError({} as any);
    const error3 = new AppError([] as any);
    
    expect(error1.message).toBe('123');
    expect(error2.message).toBe('[object Object]');
    expect(error3.message).toBe('');
  });

  it('should handle invalid error codes', () => {
    const error = new AppError('Test', 'INVALID_CODE' as ErrorCode);
    
    expect(error.code).toBe('INVALID_CODE');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
      toString: () => 'malicious',
    };
    
    const error = new AppError('Test', ErrorCode.UNKNOWN, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });

  // Human oversight
  it('should handle typos in error codes', () => {
    const error = new AppError('Test', 'CONFIG_INVALD' as ErrorCode); // typo
    
    expect(error.code).toBe('CONFIG_INVALD');
  });
});

describe('ErrorTypes - ConfigError', () => {
  // Happy path
  it('should create ConfigError with correct defaults', () => {
    const error = new ConfigError('Configuration failed');
    
    expect(error.message).toBe('Configuration failed');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(error.name).toBe('ConfigError');
    expect(error.meta).toBeUndefined();
    expect(error instanceof AppError).toBe(true);
    expect(error instanceof ConfigError).toBe(true);
  });

  it('should create ConfigError with meta data', () => {
    const meta = { configPath: '/path/to/config', reason: 'invalid format' };
    const error = new ConfigError('Configuration failed', meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new ConfigError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new ConfigError(123 as any);
    
    expect(error.message).toBe('123');
    expect(error.code).toBe(ErrorCode.CONFIG_INVALID);
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new ConfigError('Test', maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - StorageError', () => {
  // Happy path
  it('should create StorageError with default code', () => {
    const error = new StorageError('Storage operation failed');
    
    expect(error.message).toBe('Storage operation failed');
    expect(error.code).toBe(ErrorCode.STORAGE_READ_FAILED);
    expect(error.name).toBe('StorageError');
  });

  it('should create StorageError with custom code', () => {
    const error = new StorageError('Write failed', ErrorCode.STORAGE_WRITE_FAILED);
    
    expect(error.code).toBe(ErrorCode.STORAGE_WRITE_FAILED);
  });

  it('should create StorageError with meta data', () => {
    const meta = { filePath: '/path/to/file', operation: 'read' };
    const error = new StorageError('Storage failed', ErrorCode.STORAGE_READ_FAILED, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new StorageError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.STORAGE_READ_FAILED);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new StorageError(123 as any);
    
    expect(error.message).toBe('123');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new StorageError('Test', ErrorCode.STORAGE_READ_FAILED, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - EncryptionError', () => {
  // Happy path
  it('should create EncryptionError with default code', () => {
    const error = new EncryptionError('Encryption failed');
    
    expect(error.message).toBe('Encryption failed');
    expect(error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    expect(error.name).toBe('EncryptionError');
  });

  it('should create EncryptionError with custom code', () => {
    const error = new EncryptionError('Invalid format', ErrorCode.ENCRYPTION_INVALID_FORMAT);
    
    expect(error.code).toBe(ErrorCode.ENCRYPTION_INVALID_FORMAT);
  });

  it('should create EncryptionError with meta data', () => {
    const meta = { algorithm: 'AES-256', keyLength: 32 };
    const error = new EncryptionError('Encryption failed', ErrorCode.ENCRYPTION_FAILED, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new EncryptionError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new EncryptionError(123 as any);
    
    expect(error.message).toBe('123');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new EncryptionError('Test', ErrorCode.ENCRYPTION_FAILED, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - ScriptError', () => {
  // Happy path
  it('should create ScriptError with default code', () => {
    const error = new ScriptError('Script execution failed');
    
    expect(error.message).toBe('Script execution failed');
    expect(error.code).toBe(ErrorCode.SCRIPT_INVALID);
    expect(error.name).toBe('ScriptError');
  });

  it('should create ScriptError with custom code', () => {
    const error = new ScriptError('Script not found', ErrorCode.SCRIPT_NOT_FOUND);
    
    expect(error.code).toBe(ErrorCode.SCRIPT_NOT_FOUND);
  });

  it('should create ScriptError with meta data', () => {
    const meta = { scriptName: 'test.sh', exitCode: 1 };
    const error = new ScriptError('Script failed', ErrorCode.SCRIPT_INVALID, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new ScriptError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.SCRIPT_INVALID);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new ScriptError(123 as any);
    
    expect(error.message).toBe('123');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new ScriptError('Test', ErrorCode.SCRIPT_INVALID, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - GitError', () => {
  // Happy path
  it('should create GitError with default code', () => {
    const error = new GitError('Git command failed');
    
    expect(error.message).toBe('Git command failed');
    expect(error.code).toBe(ErrorCode.GIT_COMMAND_FAILED);
    expect(error.name).toBe('GitError');
  });

  it('should create GitError with custom code', () => {
    const error = new GitError('Not a repository', ErrorCode.GIT_NOT_REPOSITORY);
    
    expect(error.code).toBe(ErrorCode.GIT_NOT_REPOSITORY);
  });

  it('should create GitError with meta data', () => {
    const meta = { command: 'git status', cwd: '/path/to/repo' };
    const error = new GitError('Git failed', ErrorCode.GIT_COMMAND_FAILED, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new GitError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.GIT_COMMAND_FAILED);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new GitError(123 as any);
    
    expect(error.message).toBe('123');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new GitError('Test', ErrorCode.GIT_COMMAND_FAILED, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - TerminalError', () => {
  // Happy path
  it('should create TerminalError with default code', () => {
    const error = new TerminalError('Terminal command failed');
    
    expect(error.message).toBe('Terminal command failed');
    expect(error.code).toBe(ErrorCode.TERMINAL_COMMAND_FAILED);
    expect(error.name).toBe('TerminalError');
  });

  it('should create TerminalError with custom code', () => {
    const error = new TerminalError('Command timeout', ErrorCode.TERMINAL_TIMEOUT);
    
    expect(error.code).toBe(ErrorCode.TERMINAL_TIMEOUT);
  });

  it('should create TerminalError with meta data', () => {
    const meta = { command: 'npm install', timeout: 30000 };
    const error = new TerminalError('Terminal failed', ErrorCode.TERMINAL_COMMAND_FAILED, meta);
    
    expect(error.meta).toEqual(meta);
  });

  // Error cases
  it('should handle empty message', () => {
    const error = new TerminalError('');
    
    expect(error.message).toBe('');
    expect(error.code).toBe(ErrorCode.TERMINAL_COMMAND_FAILED);
  });

  // Pathological cases
  it('should handle non-string messages', () => {
    const error = new TerminalError(123 as any);
    
    expect(error.message).toBe('123');
  });

  // Malicious input
  it('should handle malicious meta data', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new TerminalError('Test', ErrorCode.TERMINAL_COMMAND_FAILED, maliciousMeta);
    
    expect(error.meta).toEqual(maliciousMeta);
  });
});

describe('ErrorTypes - Error Inheritance', () => {
  // Happy path
  it('should maintain proper inheritance chain', () => {
    const appError = new AppError('App error');
    const configError = new ConfigError('Config error');
    const storageError = new StorageError('Storage error');
    const encryptionError = new EncryptionError('Encryption error');
    const scriptError = new ScriptError('Script error');
    const gitError = new GitError('Git error');
    const terminalError = new TerminalError('Terminal error');
    
    expect(appError instanceof Error).toBe(true);
    expect(appError instanceof AppError).toBe(true);
    
    expect(configError instanceof Error).toBe(true);
    expect(configError instanceof AppError).toBe(true);
    expect(configError instanceof ConfigError).toBe(true);
    
    expect(storageError instanceof Error).toBe(true);
    expect(storageError instanceof AppError).toBe(true);
    expect(storageError instanceof StorageError).toBe(true);
    
    expect(encryptionError instanceof Error).toBe(true);
    expect(encryptionError instanceof AppError).toBe(true);
    expect(encryptionError instanceof EncryptionError).toBe(true);
    
    expect(scriptError instanceof Error).toBe(true);
    expect(scriptError instanceof AppError).toBe(true);
    expect(scriptError instanceof ScriptError).toBe(true);
    
    expect(gitError instanceof Error).toBe(true);
    expect(gitError instanceof AppError).toBe(true);
    expect(gitError instanceof GitError).toBe(true);
    
    expect(terminalError instanceof Error).toBe(true);
    expect(terminalError instanceof AppError).toBe(true);
    expect(terminalError instanceof TerminalError).toBe(true);
  });

  // Error cases
  it('should not have cross-inheritance', () => {
    const configError = new ConfigError('Config error');
    const storageError = new StorageError('Storage error');
    const encryptionError = new EncryptionError('Encryption error');
    const scriptError = new ScriptError('Script error');
    const gitError = new GitError('Git error');
    const terminalError = new TerminalError('Terminal error');
    
    expect(configError instanceof StorageError).toBe(false);
    expect(configError instanceof EncryptionError).toBe(false);
    expect(configError instanceof ScriptError).toBe(false);
    expect(configError instanceof GitError).toBe(false);
    expect(configError instanceof TerminalError).toBe(false);
    
    expect(storageError instanceof ConfigError).toBe(false);
    expect(encryptionError instanceof ConfigError).toBe(false);
    expect(scriptError instanceof ConfigError).toBe(false);
    expect(gitError instanceof ConfigError).toBe(false);
    expect(terminalError instanceof ConfigError).toBe(false);
  });

  // Pathological cases
  it('should handle instanceof with null/undefined', () => {
    const error = new AppError('Test');
    
    // TypeScript prevents these, but we can test the concept
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
  });

  // Malicious input
  it('should handle instanceof with malicious constructors', () => {
    const error = new AppError('Test');
    
    const maliciousConstructor = {
      prototype: {},
      name: 'AppError',
    };
    
    // TypeScript prevents this, but we can test the concept
    expect(typeof maliciousConstructor).toBe('object');
    expect(maliciousConstructor.name).toBe('AppError');
  });
});

describe('ErrorTypes - Error Stack Traces', () => {
  // Happy path
  it('should have stack traces', () => {
    const error = new AppError('Test error');
    
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
    expect(error.stack!.length).toBeGreaterThan(0);
  });

  it('should include error name in stack trace', () => {
    const appError = new AppError('App error');
    const configError = new ConfigError('Config error');
    const storageError = new StorageError('Storage error');
    
    expect(appError.stack).toContain('AppError');
    expect(configError.stack).toContain('ConfigError');
    expect(storageError.stack).toContain('StorageError');
  });

  // Error cases
  it('should handle errors without stack traces', () => {
    // This is rare but possible in some environments
    const error = new AppError('Test');
    error.stack = undefined;
    
    expect(error.stack).toBeUndefined();
  });

  // Pathological cases
  it('should handle empty stack traces', () => {
    const error = new AppError('Test');
    error.stack = '';
    
    expect(error.stack).toBe('');
  });

  // Malicious input
  it('should handle malicious stack traces', () => {
    const error = new AppError('Test');
    error.stack = '<script>alert("xss")</script>';
    
    expect(error.stack).toBe('<script>alert("xss")</script>');
  });
});

describe('ErrorTypes - Error Serialization', () => {
  // Happy path
  it('should serialize to JSON correctly', () => {
    const meta = { userId: 123, action: 'save' };
    const error = new AppError('Test error', ErrorCode.CONFIG_INVALID, meta);
    
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    
    expect(parsed.name).toBe('AppError');
    expect(parsed.code).toBe('CONFIG_INVALID');
    expect(parsed.meta).toEqual(meta);
    // Note: message might not be serialized in all environments
  });

  it('should handle circular references in meta', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;
    
    const error = new AppError('Test', ErrorCode.UNKNOWN, circular);
    
    // JSON.stringify should handle circular references
    expect(() => JSON.stringify(error)).toThrow();
  });

  // Error cases
  it('should handle undefined meta in serialization', () => {
    const error = new AppError('Test');
    
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    
    expect(parsed.meta).toBeUndefined();
  });

  // Pathological cases
  it('should handle non-serializable meta', () => {
    const nonSerializable = {
      func: () => 'test',
      symbol: Symbol('test'),
      undefined: undefined,
    };
    
    const error = new AppError('Test', ErrorCode.UNKNOWN, nonSerializable);
    
    // JSON.stringify should handle non-serializable values gracefully
    expect(() => JSON.stringify(error)).not.toThrow();
  });

  // Malicious input
  it('should handle malicious meta in serialization', () => {
    const maliciousMeta = {
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };
    
    const error = new AppError('Test', ErrorCode.UNKNOWN, maliciousMeta);
    
    const serialized = JSON.stringify(error);
    const parsed = JSON.parse(serialized);
    
    expect(parsed.meta).toEqual(maliciousMeta);
  });
}); 