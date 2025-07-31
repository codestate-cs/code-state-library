import { ConfigRepository } from '@codestate/infrastructure/repositories/ConfigRepository';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IEncryptionService } from '@codestate/core/domain/ports/IEncryptionService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result } from '@codestate/core/domain/models/Result';
import { ConfigError } from '@codestate/core/domain/types/ErrorTypes';

// Mock fs/promises
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockMkdir = jest.fn();

jest.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir
}));

// Mock path
const mockJoin = jest.fn();
jest.mock('path', () => ({
  join: mockJoin
}));

describe('ConfigRepository', () => {
  let configRepository: ConfigRepository;
  let mockLogger: jest.Mocked<ILoggerService>;
  let mockEncryption: jest.Mocked<IEncryptionService>;

  const defaultConfig: Config = {
    version: '1.0.0',
    ide: 'vscode',
    encryption: { enabled: false },
    storagePath: '/tmp/.codestate',
    logger: { 
      level: 'LOG', 
      sinks: ['file'],
      filePath: '/tmp/.codestate/logs/codestate.log'
    },
    experimental: {},
    extensions: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    mockEncryption = {
      encrypt: jest.fn(),
      decrypt: jest.fn()
    };
    mockJoin.mockReturnValue('/tmp/.codestate/config.json');
    configRepository = new ConfigRepository(mockLogger, mockEncryption);
  });

  describe('Happy Path Tests', () => {
    it('should load config successfully', async () => {
      const configData = JSON.stringify(defaultConfig);
      mockReadFile.mockResolvedValue(configData);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(defaultConfig);
      expect(mockLogger.debug).toHaveBeenCalledWith('Attempting to load config', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should save config successfully', async () => {
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const result = await configRepository.save(defaultConfig);

      expect(result.ok).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/.codestate/config.json',
        JSON.stringify(defaultConfig, null, 2),
        'utf8'
      );
    });

    it('should create default config when file not found', async () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      mockReadFile.mockRejectedValue(error);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(defaultConfig);
      expect(mockLogger.warn).toHaveBeenCalledWith('Config file not found. Creating default config.', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should handle encrypted config files', async () => {
      const encryptedData = 'ENCRYPTED_v1:encrypted-content';
      const decryptedData = JSON.stringify(defaultConfig);
      
      mockReadFile.mockResolvedValue(encryptedData);
      mockEncryption.decrypt.mockResolvedValue({
        ok: true,
        value: decryptedData
      });

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(defaultConfig);
      expect(mockLogger.log).toHaveBeenCalledWith('Config file is encrypted. Attempting decryption.', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should save encrypted config when encryption is enabled', async () => {
      const configWithEncryption = {
        ...defaultConfig,
        encryption: { enabled: true, encryptionKey: 'test-key' }
      };
      const encryptedData = 'ENCRYPTED_v1:encrypted-content';
      
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);
      mockEncryption.encrypt.mockResolvedValue({
        ok: true,
        value: encryptedData
      });

      const result = await configRepository.save(configWithEncryption);

      expect(result.ok).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/.codestate/config.json',
        encryptedData,
        'utf8'
      );
      expect(mockLogger.log).toHaveBeenCalledWith('Encrypting config before save', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should handle config with custom path', async () => {
      const customPath = '/custom/path/config.json';
      const repository = new ConfigRepository(mockLogger, mockEncryption, customPath);
      const configData = JSON.stringify(defaultConfig);
      
      mockReadFile.mockResolvedValue(configData);

      const result = await repository.load();

      expect(result.ok).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('Attempting to load config', {
        path: customPath
      });
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null config for save', async () => {
      const result = await configRepository.save(null as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });

    it('should handle undefined config for save', async () => {
      const result = await configRepository.save(undefined as any);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });

    it('should handle invalid config structure', async () => {
      const invalidConfig = {
        version: '1.0.0',
        // Missing required fields
      } as any;

      const result = await configRepository.save(invalidConfig);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });

    it('should handle null logger', () => {
      expect(() => {
        new ConfigRepository(null as any, mockEncryption);
      }).toThrow();
    });

    it('should handle null encryption service', () => {
      expect(() => {
        new ConfigRepository(mockLogger, null as any);
      }).toThrow();
    });

    it('should handle empty config path', () => {
      expect(() => {
        new ConfigRepository(mockLogger, mockEncryption, '');
      }).not.toThrow();
    });
  });

  describe('Failure Tests', () => {
    it('should handle file read errors', async () => {
      const error = new Error('Permission denied');
      mockReadFile.mockRejectedValue(error);

      const result = await configRepository.load();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load config', {
        error: 'Permission denied',
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should handle file write errors', async () => {
      const error = new Error('Disk full');
      mockWriteFile.mockRejectedValue(error);
      mockMkdir.mockResolvedValue(undefined);

      const result = await configRepository.save(defaultConfig);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });

    it('should handle directory creation errors', async () => {
      const error = new Error('Permission denied');
      mockMkdir.mockRejectedValue(error);

      const result = await configRepository.save(defaultConfig);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });

    it('should handle JSON parse errors', async () => {
      const invalidJson = '{"invalid": json}';
      mockReadFile.mockResolvedValue(invalidJson);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(defaultConfig);
      expect(mockLogger.error).toHaveBeenCalledWith('Config file is corrupt (invalid JSON). Backing up and creating default.', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should handle schema validation errors', async () => {
      const invalidConfig = JSON.stringify({
        version: '1.0.0',
        // Missing required fields
      });
      mockReadFile.mockResolvedValue(invalidConfig);
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(defaultConfig);
      expect(mockLogger.error).toHaveBeenCalledWith('Config file is corrupt (schema validation failed). Backing up and creating default.', {
        path: '/tmp/.codestate/config.json'
      });
    });

    it('should handle decryption errors', async () => {
      const encryptedData = 'ENCRYPTED_v1:encrypted-content';
      mockReadFile.mockResolvedValue(encryptedData);
      mockEncryption.decrypt.mockResolvedValue({
        ok: false,
        error: new Error('Decryption failed')
      });

      const result = await configRepository.load();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle encryption errors during save', async () => {
      const configWithEncryption = {
        ...defaultConfig,
        encryption: { enabled: true, encryptionKey: 'test-key' }
      };
      
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);
      mockEncryption.encrypt.mockResolvedValue({
        ok: false,
        error: new Error('Encryption failed')
      });

      const result = await configRepository.save(configWithEncryption);

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(ConfigError);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large config files', async () => {
      const largeConfig = {
        ...defaultConfig,
        experimental: {
          largeData: 'a'.repeat(1000000)
        }
      };
      const configData = JSON.stringify(largeConfig);
      
      mockReadFile.mockResolvedValue(configData);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(largeConfig);
    });

    it('should handle deeply nested config objects', async () => {
      const deepConfig = {
        ...defaultConfig,
        experimental: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: {
                      level7: {
                        level8: {
                          level9: {
                            level10: 'deep value'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      const configData = JSON.stringify(deepConfig);
      
      mockReadFile.mockResolvedValue(configData);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(deepConfig);
    });

    it('should handle unicode characters in config', async () => {
      const unicodeConfig = {
        ...defaultConfig,
        experimental: {
          unicodeValue: '测试中文 🚀 emoji: 测试'
        }
      };
      const configData = JSON.stringify(unicodeConfig);
      
      mockReadFile.mockResolvedValue(configData);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(unicodeConfig);
    });

    it('should handle concurrent load operations', async () => {
      const configData = JSON.stringify(defaultConfig);
      mockReadFile.mockResolvedValue(configData);

      const promises = Array.from({ length: 10 }, () => configRepository.load());
      const results = await Promise.all(promises);

      expect(results.every(result => result.ok)).toBe(true);
    });

    it('should handle concurrent save operations', async () => {
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const promises = Array.from({ length: 10 }, () => configRepository.save(defaultConfig));
      const results = await Promise.all(promises);

      expect(results.every(result => result.ok)).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in config keys', async () => {
      const typoConfig = JSON.stringify({
        version: '1.0.0',
        ide: 'vscode',
        encryption: { enabled: false },
        storagePath: '/tmp/.codestate',
        logger: { 
          level: 'LOG', 
          sinks: ['file'],
          filePath: '/tmp/.codestate/logs/codestate.log'
        },
        experimental: {},
        extensions: {},
        // Extra typo field
        experimantal: { typo: 'value' }
      });
      
      mockReadFile.mockResolvedValue(typoConfig);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      // Should still load successfully with extra fields
      expect(result.value).toBeDefined();
    });

    it('should handle case sensitivity in config keys', async () => {
      const caseConfig = JSON.stringify({
        Version: '1.0.0',
        IDE: 'vscode',
        Encryption: { enabled: false },
        StoragePath: '/tmp/.codestate',
        Logger: { 
          Level: 'LOG', 
          Sinks: ['file'],
          FilePath: '/tmp/.codestate/logs/codestate.log'
        },
        Experimental: {},
        Extensions: {},
      });
      
      mockReadFile.mockResolvedValue(caseConfig);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      // Should handle case differences gracefully
      expect(result.value).toBeDefined();
    });

    it('should handle missing optional fields', async () => {
      const minimalConfig = JSON.stringify({
        version: '1.0.0',
        ide: 'vscode',
        encryption: { enabled: false },
        storagePath: '/tmp/.codestate',
        logger: { 
          level: 'LOG', 
          sinks: ['file'],
          filePath: '/tmp/.codestate/logs/codestate.log'
        }
        // Missing experimental and extensions
      });
      
      mockReadFile.mockResolvedValue(minimalConfig);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle wrong data types in config', async () => {
      const wrongTypeConfig = JSON.stringify({
        version: 123, // Should be string
        ide: 456, // Should be string
        encryption: 'not-an-object', // Should be object
        storagePath: null, // Should be string
        logger: { 
          level: 'LOG', 
          sinks: ['file'],
          filePath: '/tmp/.codestate/logs/codestate.log'
        },
        experimental: {},
        extensions: {},
      });
      
      mockReadFile.mockResolvedValue(wrongTypeConfig);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      // Should handle type mismatches gracefully
      expect(result.value).toBeDefined();
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle null bytes in config data', async () => {
      const configWithNullBytes = JSON.stringify({
        ...defaultConfig,
        experimental: {
          nullByteValue: 'value\x00with\x00null\x00bytes'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithNullBytes);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle control characters in config data', async () => {
      const configWithControl = JSON.stringify({
        ...defaultConfig,
        experimental: {
          controlValue: 'value\x01\x02\x03with\x04\x05\x06control'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithControl);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle script injection in config data', async () => {
      const configWithScript = JSON.stringify({
        ...defaultConfig,
        experimental: {
          scriptValue: '<script>alert("xss")</script>'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithScript);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle SQL injection in config data', async () => {
      const configWithSQL = JSON.stringify({
        ...defaultConfig,
        experimental: {
          sqlValue: '; DROP TABLE users; --'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithSQL);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle path traversal in config paths', async () => {
      const configWithPathTraversal = JSON.stringify({
        ...defaultConfig,
        storagePath: '../../../etc/passwd',
        logger: {
          ...defaultConfig.logger,
          filePath: '../../../etc/passwd'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithPathTraversal);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should handle command injection in config data', async () => {
      const configWithCommand = JSON.stringify({
        ...defaultConfig,
        experimental: {
          commandValue: '$(rm -rf /)'
        }
      });
      
      mockReadFile.mockResolvedValue(configWithCommand);

      const result = await configRepository.load();

      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });
  });

  describe('Method Tests', () => {
    it('should have load method', () => {
      expect(typeof configRepository.load).toBe('function');
    });

    it('should have save method', () => {
      expect(typeof configRepository.save).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle load-save round trip', async () => {
      // Mock load
      const configData = JSON.stringify(defaultConfig);
      mockReadFile.mockResolvedValue(configData);

      const loadResult = await configRepository.load();
      expect(loadResult.ok).toBe(true);

      // Mock save
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      const saveResult = await configRepository.save(loadResult.value!);
      expect(saveResult.ok).toBe(true);
    });

    it('should handle encrypted config round trip', async () => {
      const configWithEncryption = {
        ...defaultConfig,
        encryption: { enabled: true, encryptionKey: 'test-key' }
      };

      // Mock save with encryption
      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);
      mockEncryption.encrypt.mockResolvedValue({
        ok: true,
        value: 'ENCRYPTED_v1:encrypted-content'
      });

      const saveResult = await configRepository.save(configWithEncryption);
      expect(saveResult.ok).toBe(true);

      // Mock load with decryption
      mockReadFile.mockResolvedValue('ENCRYPTED_v1:encrypted-content');
      mockEncryption.decrypt.mockResolvedValue({
        ok: true,
        value: JSON.stringify(configWithEncryption)
      });

      const loadResult = await configRepository.load();
      expect(loadResult.ok).toBe(true);
      expect(loadResult.value).toEqual(configWithEncryption);
    });

    it('should handle multiple config operations', async () => {
      const configs = [
        { ...defaultConfig, version: '1.0.0' },
        { ...defaultConfig, version: '1.0.1' },
        { ...defaultConfig, version: '1.0.2' }
      ];

      mockWriteFile.mockResolvedValue(undefined);
      mockMkdir.mockResolvedValue(undefined);

      // Save multiple configs
      const savePromises = configs.map(config => configRepository.save(config));
      const saveResults = await Promise.all(savePromises);
      expect(saveResults.every(result => result.ok)).toBe(true);

      // Load multiple configs
      configs.forEach((config, index) => {
        mockReadFile.mockResolvedValueOnce(JSON.stringify(config));
      });

      const loadPromises = Array.from({ length: 3 }, () => configRepository.load());
      const loadResults = await Promise.all(loadPromises);
      expect(loadResults.every(result => result.ok)).toBe(true);
    });
  });
}); 