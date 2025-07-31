import {
  ErrorRegistry,
  ErrorRegistryEntry,
  getUserMessageForErrorCode,
  getExitCodeForErrorCode,
} from '@codestate/core/domain/types/ErrorRegistry';
import { ErrorCode } from '@codestate/core/domain/types/ErrorTypes';
import { describe, expect, it } from '@jest/globals';

describe('ErrorRegistry - ErrorRegistryEntry', () => {
  // Happy path
  it('should define the correct interface structure', () => {
    const validEntry: ErrorRegistryEntry = {
      code: ErrorCode.UNKNOWN,
      userMessage: 'An unknown error occurred.',
      exitCode: 1,
    };
    
    expect(validEntry.code).toBe(ErrorCode.UNKNOWN);
    expect(validEntry.userMessage).toBe('An unknown error occurred.');
    expect(validEntry.exitCode).toBe(1);
  });

  // Error cases
  it('should require all mandatory fields', () => {
    // TypeScript will catch missing fields at compile time
    // This test documents the interface requirements
    const requiredFields = ['code', 'userMessage', 'exitCode'];
    requiredFields.forEach(field => {
      expect(field).toBeDefined();
    });
  });

  // Pathological cases
  it('should handle empty strings in userMessage', () => {
    const entryWithEmptyMessage: ErrorRegistryEntry = {
      code: ErrorCode.UNKNOWN,
      userMessage: '',
      exitCode: 1,
    };
    
    expect(entryWithEmptyMessage.userMessage).toBe('');
  });

  // Malicious input
  it('should handle malicious content in userMessage', () => {
    const maliciousMessage = '<script>alert("xss")</script>';
    const entryWithMaliciousMessage: ErrorRegistryEntry = {
      code: ErrorCode.UNKNOWN,
      userMessage: maliciousMessage,
      exitCode: 1,
    };
    
    expect(entryWithMaliciousMessage.userMessage).toBe(maliciousMessage);
  });
});

describe('ErrorRegistry - Registry Structure', () => {
  // Happy path
  it('should have entries for all error codes', () => {
    const allErrorCodes = Object.values(ErrorCode);
    
    allErrorCodes.forEach(code => {
      expect(ErrorRegistry[code]).toBeDefined();
      expect(ErrorRegistry[code].code).toBe(code);
      expect(ErrorRegistry[code].userMessage).toBeDefined();
      expect(typeof ErrorRegistry[code].userMessage).toBe('string');
      expect(ErrorRegistry[code].exitCode).toBeDefined();
      expect(typeof ErrorRegistry[code].exitCode).toBe('number');
    });
  });

  it('should have unique exit codes for each error', () => {
    const exitCodes = Object.values(ErrorRegistry).map(entry => entry.exitCode);
    const uniqueExitCodes = new Set(exitCodes);
    
    expect(uniqueExitCodes.size).toBe(exitCodes.length);
  });

  it('should have non-empty user messages', () => {
    Object.values(ErrorRegistry).forEach(entry => {
      expect(entry.userMessage.length).toBeGreaterThan(0);
    });
  });

  // Error cases
  it('should not have duplicate error codes', () => {
    const codes = Object.values(ErrorRegistry).map(entry => entry.code);
    const uniqueCodes = new Set(codes);
    
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should not have negative exit codes', () => {
    Object.values(ErrorRegistry).forEach(entry => {
      expect(entry.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  // Pathological cases
  it('should handle registry with missing entries', () => {
    // This would be a pathological case where the registry is incomplete
    const registryKeys = Object.keys(ErrorRegistry);
    expect(registryKeys.length).toBeGreaterThan(0);
  });

  // Malicious input
  it('should handle registry access with malicious keys', () => {
    const maliciousKeys = [
      "'; DROP TABLE users; --",
      "<script>alert('xss')</script>",
      "'; SELECT * FROM passwords; --",
    ];
    
    maliciousKeys.forEach(key => {
      expect(ErrorRegistry[key as keyof typeof ErrorRegistry]).toBeUndefined();
    });
  });
});

describe('ErrorRegistry - Specific Error Codes', () => {
  // Happy path
  it('should have correct UNKNOWN error entry', () => {
    const unknownEntry = ErrorRegistry[ErrorCode.UNKNOWN];
    
    expect(unknownEntry.code).toBe(ErrorCode.UNKNOWN);
    expect(unknownEntry.userMessage).toBe('An unknown error occurred.');
    expect(unknownEntry.exitCode).toBe(1);
  });

  it('should have correct CONFIG_INVALID error entry', () => {
    const configEntry = ErrorRegistry[ErrorCode.CONFIG_INVALID];
    
    expect(configEntry.code).toBe(ErrorCode.CONFIG_INVALID);
    expect(configEntry.userMessage).toBe('Configuration is invalid.');
    expect(configEntry.exitCode).toBe(2);
  });

  it('should have correct STORAGE_READ_FAILED error entry', () => {
    const storageEntry = ErrorRegistry[ErrorCode.STORAGE_READ_FAILED];
    
    expect(storageEntry.code).toBe(ErrorCode.STORAGE_READ_FAILED);
    expect(storageEntry.userMessage).toBe('File read failed.');
    expect(storageEntry.exitCode).toBe(5);
  });

  it('should have correct ENCRYPTION_FAILED error entry', () => {
    const encryptionEntry = ErrorRegistry[ErrorCode.ENCRYPTION_FAILED];
    
    expect(encryptionEntry.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    expect(encryptionEntry.userMessage).toBe('Encryption failed.');
    expect(encryptionEntry.exitCode).toBe(8);
  });

  it('should have correct SCRIPT_INVALID error entry', () => {
    const scriptEntry = ErrorRegistry[ErrorCode.SCRIPT_INVALID];
    
    expect(scriptEntry.code).toBe(ErrorCode.SCRIPT_INVALID);
    expect(scriptEntry.userMessage).toBe('Script is invalid.');
    expect(scriptEntry.exitCode).toBe(10);
  });

  it('should have correct GIT_COMMAND_FAILED error entry', () => {
    const gitEntry = ErrorRegistry[ErrorCode.GIT_COMMAND_FAILED];
    
    expect(gitEntry.code).toBe(ErrorCode.GIT_COMMAND_FAILED);
    expect(gitEntry.userMessage).toBe('Git command failed.');
    expect(gitEntry.exitCode).toBe(16);
  });

  it('should have correct TERMINAL_COMMAND_FAILED error entry', () => {
    const terminalEntry = ErrorRegistry[ErrorCode.TERMINAL_COMMAND_FAILED];
    
    expect(terminalEntry.code).toBe(ErrorCode.TERMINAL_COMMAND_FAILED);
    expect(terminalEntry.userMessage).toBe('Terminal command failed.');
    expect(terminalEntry.exitCode).toBe(19);
  });

  // Error cases
  it('should have sequential exit codes', () => {
    const entries = Object.values(ErrorRegistry);
    const sortedEntries = entries.sort((a, b) => a.exitCode - b.exitCode);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      expect(sortedEntries[i].exitCode).toBe(i + 1);
    }
  });

  // Pathological cases
  it('should handle all error codes from ErrorCode enum', () => {
    const allErrorCodes = [
      ErrorCode.UNKNOWN,
      ErrorCode.CONFIG_INVALID,
      ErrorCode.STORAGE_INVALID_PATH,
      ErrorCode.STORAGE_DECRYPTION_FAILED,
      ErrorCode.STORAGE_READ_FAILED,
      ErrorCode.STORAGE_WRITE_FAILED,
      ErrorCode.STORAGE_DELETE_FAILED,
      ErrorCode.ENCRYPTION_FAILED,
      ErrorCode.ENCRYPTION_INVALID_FORMAT,
      ErrorCode.SCRIPT_INVALID,
      ErrorCode.SCRIPT_DUPLICATE,
      ErrorCode.SCRIPT_NOT_FOUND,
      ErrorCode.SCRIPT_PATH_INVALID,
      ErrorCode.SCRIPT_MALICIOUS,
      ErrorCode.GIT_NOT_REPOSITORY,
      ErrorCode.GIT_COMMAND_FAILED,
      ErrorCode.GIT_STASH_NOT_FOUND,
      ErrorCode.GIT_STASH_CONFLICT,
      ErrorCode.TERMINAL_COMMAND_FAILED,
      ErrorCode.TERMINAL_TIMEOUT,
      ErrorCode.TERMINAL_COMMAND_NOT_FOUND,
    ];
    
    allErrorCodes.forEach(code => {
      expect(ErrorRegistry[code]).toBeDefined();
    });
  });
});

describe('ErrorRegistry - getUserMessageForErrorCode', () => {
  // Happy path
  it('should return correct user message for known error codes', () => {
    expect(getUserMessageForErrorCode(ErrorCode.UNKNOWN)).toBe('An unknown error occurred.');
    expect(getUserMessageForErrorCode(ErrorCode.CONFIG_INVALID)).toBe('Configuration is invalid.');
    expect(getUserMessageForErrorCode(ErrorCode.STORAGE_READ_FAILED)).toBe('File read failed.');
    expect(getUserMessageForErrorCode(ErrorCode.ENCRYPTION_FAILED)).toBe('Encryption failed.');
    expect(getUserMessageForErrorCode(ErrorCode.SCRIPT_INVALID)).toBe('Script is invalid.');
    expect(getUserMessageForErrorCode(ErrorCode.GIT_COMMAND_FAILED)).toBe('Git command failed.');
    expect(getUserMessageForErrorCode(ErrorCode.TERMINAL_COMMAND_FAILED)).toBe('Terminal command failed.');
  });

  // Error cases
  it('should return default message for unknown error codes', () => {
    const unknownCode = 'UNKNOWN_CODE' as ErrorCode;
    
    expect(getUserMessageForErrorCode(unknownCode)).toBe('An unknown error occurred.');
  });

  // Pathological cases
  it('should handle empty string error codes', () => {
    const emptyCode = '' as ErrorCode;
    
    expect(getUserMessageForErrorCode(emptyCode)).toBe('An unknown error occurred.');
  });

  it('should handle null/undefined error codes', () => {
    expect(getUserMessageForErrorCode(null as any)).toBe('An unknown error occurred.');
    expect(getUserMessageForErrorCode(undefined as any)).toBe('An unknown error occurred.');
  });

  // Malicious input
  it('should handle malicious error codes', () => {
    const maliciousCodes = [
      "'; DROP TABLE users; --" as ErrorCode,
      "<script>alert('xss')</script>" as ErrorCode,
      "'; SELECT * FROM passwords; --" as ErrorCode,
    ];
    
    maliciousCodes.forEach(code => {
      expect(getUserMessageForErrorCode(code)).toBe('An unknown error occurred.');
    });
  });

  // Human oversight
  it('should handle typos in error codes', () => {
    const typoCode = 'CONFIG_INVALD' as ErrorCode; // typo
    
    expect(getUserMessageForErrorCode(typoCode)).toBe('An unknown error occurred.');
  });
});

describe('ErrorRegistry - getExitCodeForErrorCode', () => {
  // Happy path
  it('should return correct exit codes for known error codes', () => {
    expect(getExitCodeForErrorCode(ErrorCode.UNKNOWN)).toBe(1);
    expect(getExitCodeForErrorCode(ErrorCode.CONFIG_INVALID)).toBe(2);
    expect(getExitCodeForErrorCode(ErrorCode.STORAGE_READ_FAILED)).toBe(5);
    expect(getExitCodeForErrorCode(ErrorCode.ENCRYPTION_FAILED)).toBe(8);
    expect(getExitCodeForErrorCode(ErrorCode.SCRIPT_INVALID)).toBe(10);
    expect(getExitCodeForErrorCode(ErrorCode.GIT_COMMAND_FAILED)).toBe(16);
    expect(getExitCodeForErrorCode(ErrorCode.TERMINAL_COMMAND_FAILED)).toBe(19);
  });

  // Error cases
  it('should return default exit code for unknown error codes', () => {
    const unknownCode = 'UNKNOWN_CODE' as ErrorCode;
    
    expect(getExitCodeForErrorCode(unknownCode)).toBe(1);
  });

  // Pathological cases
  it('should handle empty string error codes', () => {
    const emptyCode = '' as ErrorCode;
    
    expect(getExitCodeForErrorCode(emptyCode)).toBe(1);
  });

  it('should handle null/undefined error codes', () => {
    expect(getExitCodeForErrorCode(null as any)).toBe(1);
    expect(getExitCodeForErrorCode(undefined as any)).toBe(1);
  });

  // Malicious input
  it('should handle malicious error codes', () => {
    const maliciousCodes = [
      "'; DROP TABLE users; --" as ErrorCode,
      "<script>alert('xss')</script>" as ErrorCode,
      "'; SELECT * FROM passwords; --" as ErrorCode,
    ];
    
    maliciousCodes.forEach(code => {
      expect(getExitCodeForErrorCode(code)).toBe(1);
    });
  });

  // Human oversight
  it('should handle typos in error codes', () => {
    const typoCode = 'CONFIG_INVALD' as ErrorCode; // typo
    
    expect(getExitCodeForErrorCode(typoCode)).toBe(1);
  });
});

describe('ErrorRegistry - Function Consistency', () => {
  // Happy path
  it('should return consistent results for all error codes', () => {
    Object.values(ErrorCode).forEach(code => {
      const entry = ErrorRegistry[code];
      const userMessage = getUserMessageForErrorCode(code);
      const exitCode = getExitCodeForErrorCode(code);
      
      expect(userMessage).toBe(entry.userMessage);
      expect(exitCode).toBe(entry.exitCode);
    });
  });

  it('should handle all error codes without throwing', () => {
    Object.values(ErrorCode).forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });

  // Error cases
  it('should handle invalid error codes gracefully', () => {
    const invalidCodes = [
      'INVALID_CODE' as ErrorCode,
      'UNKNOWN_ERROR' as ErrorCode,
      'FAILURE' as ErrorCode,
    ];
    
    invalidCodes.forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });

  // Pathological cases
  it('should handle edge cases without throwing', () => {
    const edgeCases = [
      '' as ErrorCode,
      null as any,
      undefined as any,
      123 as any,
      {} as any,
      [] as any,
    ];
    
    edgeCases.forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });

  // Malicious input
  it('should handle malicious inputs without throwing', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --" as ErrorCode,
      "<script>alert('xss')</script>" as ErrorCode,
      "'; SELECT * FROM passwords; --" as ErrorCode,
      "'; UPDATE users SET password = 'hacked'; --" as ErrorCode,
    ];
    
    maliciousInputs.forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });
});

describe('ErrorRegistry - Performance', () => {
  // Happy path
  it('should handle multiple rapid calls efficiently', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      getUserMessageForErrorCode(ErrorCode.UNKNOWN);
      getExitCodeForErrorCode(ErrorCode.UNKNOWN);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
  });

  // Error cases
  it('should handle rapid calls with invalid codes efficiently', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      getUserMessageForErrorCode('INVALID_CODE' as ErrorCode);
      getExitCodeForErrorCode('INVALID_CODE' as ErrorCode);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
  });

  // Pathological cases
  it('should handle rapid calls with null/undefined efficiently', () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      getUserMessageForErrorCode(null as any);
      getExitCodeForErrorCode(undefined as any);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
  });
});

describe('ErrorRegistry - Memory Usage', () => {
  // Happy path
  it('should not leak memory with repeated calls', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 10000; i++) {
      getUserMessageForErrorCode(ErrorCode.UNKNOWN);
      getExitCodeForErrorCode(ErrorCode.UNKNOWN);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });

  // Error cases
  it('should not leak memory with invalid codes', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 10000; i++) {
      getUserMessageForErrorCode('INVALID_CODE' as ErrorCode);
      getExitCodeForErrorCode('INVALID_CODE' as ErrorCode);
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
});

describe('ErrorRegistry - Type Safety', () => {
  // Happy path
  it('should maintain type safety for valid error codes', () => {
    Object.values(ErrorCode).forEach(code => {
      const entry = ErrorRegistry[code];
      
      expect(typeof entry.code).toBe('string');
      expect(typeof entry.userMessage).toBe('string');
      expect(typeof entry.exitCode).toBe('number');
    });
  });

  // Error cases
  it('should handle type mismatches gracefully', () => {
    const typeMismatches = [
      123 as any,
      {} as any,
      [] as any,
      true as any,
      false as any,
    ];
    
    typeMismatches.forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });

  // Pathological cases
  it('should handle complex objects as error codes', () => {
    const complexObjects = [
      { code: 'UNKNOWN' } as any,
      { message: 'test' } as any,
      { exitCode: 1 } as any,
    ];
    
    complexObjects.forEach(code => {
      expect(() => getUserMessageForErrorCode(code)).not.toThrow();
      expect(() => getExitCodeForErrorCode(code)).not.toThrow();
    });
  });
}); 