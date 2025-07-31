import { GetConfig } from '@codestate/core/use-cases/config/GetConfig';
import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result } from '@codestate/core/domain/models/Result';
import { ConfigError } from '@codestate/core/domain/types/ErrorTypes';

describe('GetConfig', () => {
  let getConfig: GetConfig;
  let mockConfigService: jest.Mocked<IConfigService>;

  const testConfig: Config = {
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
    mockConfigService = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      resetConfig: jest.fn(),
      exportConfig: jest.fn(),
      importConfig: jest.fn()
    };
    getConfig = new GetConfig(mockConfigService);
  });

  describe('Happy Path Tests', () => {
    it('should get config successfully', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: testConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(testConfig);
      expect(mockConfigService.getConfig).toHaveBeenCalled();
    });

    it('should handle config with all fields populated', async () => {
      const fullConfig: Config = {
        version: '1.0.0',
        ide: 'vscode',
        encryption: { enabled: true, encryptionKey: 'test-key' },
        storagePath: '/custom/path',
        logger: { 
          level: 'DEBUG', 
          sinks: ['file', 'console'],
          filePath: '/custom/path/logs/codestate.log'
        },
        experimental: {
          feature1: true,
          feature2: 'enabled'
        },
        extensions: {
          extension1: { enabled: true },
          extension2: { enabled: false }
        },
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: fullConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(fullConfig);
    });

    it('should handle minimal config', async () => {
      const minimalConfig: Config = {
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

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: minimalConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(minimalConfig);
    });

    it('should handle config with unicode characters', async () => {
      const unicodeConfig: Config = {
        ...testConfig,
        experimental: {
          unicodeValue: '测试中文 🚀 emoji: 测试'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: unicodeConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(unicodeConfig);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null config service', () => {
      expect(() => {
        new GetConfig(null as any);
      }).toThrow();
    });

    it('should handle undefined config service', () => {
      expect(() => {
        new GetConfig(undefined as any);
      }).toThrow();
    });

    it('should handle config service without getConfig method', () => {
      const invalidService = {} as IConfigService;
      
      expect(() => {
        new GetConfig(invalidService);
      }).toThrow();
    });
  });

  describe('Failure Tests', () => {
    it('should handle config service errors', async () => {
      const error = new ConfigError('Config service error');
      mockConfigService.getConfig.mockResolvedValue({
        ok: false,
        error
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockConfigService.getConfig.mockRejectedValue(error);

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Operation timed out');
      mockConfigService.getConfig.mockRejectedValue(error);

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied');
      mockConfigService.getConfig.mockRejectedValue(error);

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle file system errors', async () => {
      const error = new Error('ENOENT: no such file or directory');
      mockConfigService.getConfig.mockRejectedValue(error);

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large config', async () => {
      const largeConfig: Config = {
        ...testConfig,
        experimental: {
          largeData: 'a'.repeat(1000000)
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: largeConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(largeConfig);
    });

    it('should handle deeply nested config', async () => {
      const deepConfig: Config = {
        ...testConfig,
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

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: deepConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(deepConfig);
    });

    it('should handle concurrent executions', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: testConfig
      });

      const promises = Array.from({ length: 10 }, () => getConfig.execute());
      const results = await Promise.all(promises);

      expect(results.every(result => result.ok)).toBe(true);
      expect(mockConfigService.getConfig).toHaveBeenCalledTimes(10);
    });

    it('should handle high frequency executions', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: testConfig
      });

      for (let i = 0; i < 100; i++) {
        const result = await getConfig.execute();
        expect(result.ok).toBe(true);
      }

      expect(mockConfigService.getConfig).toHaveBeenCalledTimes(100);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle config service returning null', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: null as any
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should handle config service returning undefined', async () => {
      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: undefined as any
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should handle config service returning invalid config', async () => {
      const invalidConfig = {
        version: '1.0.0',
        // Missing required fields
      } as any;

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: invalidConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(invalidConfig);
    });

    it('should handle config service returning wrong data types', async () => {
      const wrongTypeConfig = {
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
      } as any;

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: wrongTypeConfig
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(wrongTypeConfig);
    });

    it('should handle config service throwing instead of returning Result', async () => {
      const error = new Error('Unexpected error');
      mockConfigService.getConfig.mockRejectedValue(error);

      const result = await getConfig.execute();

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle config with null bytes', async () => {
      const configWithNullBytes: Config = {
        ...testConfig,
        experimental: {
          nullByteValue: 'value\x00with\x00null\x00bytes'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithNullBytes
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithNullBytes);
    });

    it('should handle config with control characters', async () => {
      const configWithControl: Config = {
        ...testConfig,
        experimental: {
          controlValue: 'value\x01\x02\x03with\x04\x05\x06control'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithControl
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithControl);
    });

    it('should handle config with script injection', async () => {
      const configWithScript: Config = {
        ...testConfig,
        experimental: {
          scriptValue: '<script>alert("xss")</script>'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithScript
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithScript);
    });

    it('should handle config with SQL injection', async () => {
      const configWithSQL: Config = {
        ...testConfig,
        experimental: {
          sqlValue: '; DROP TABLE users; --'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithSQL
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithSQL);
    });

    it('should handle config with path traversal', async () => {
      const configWithPathTraversal: Config = {
        ...testConfig,
        storagePath: '../../../etc/passwd',
        logger: {
          ...testConfig.logger,
          filePath: '../../../etc/passwd'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithPathTraversal
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithPathTraversal);
    });

    it('should handle config with command injection', async () => {
      const configWithCommand: Config = {
        ...testConfig,
        experimental: {
          commandValue: '$(rm -rf /)'
        }
      };

      mockConfigService.getConfig.mockResolvedValue({
        ok: true,
        value: configWithCommand
      });

      const result = await getConfig.execute();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual(configWithCommand);
    });
  });

  describe('Method Tests', () => {
    it('should have execute method', () => {
      expect(typeof getConfig.execute).toBe('function');
    });

    it('should have configService property', () => {
      expect(getConfig).toHaveProperty('configService');
      expect(getConfig.configService).toBe(mockConfigService);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple executions with different configs', async () => {
      const configs = [
        { ...testConfig, version: '1.0.0' },
        { ...testConfig, version: '1.0.1' },
        { ...testConfig, version: '1.0.2' }
      ];

      configs.forEach((config, index) => {
        mockConfigService.getConfig.mockResolvedValueOnce({
          ok: true,
          value: config
        });
      });

      const results = await Promise.all(
        configs.map(() => getConfig.execute())
      );

      expect(results.every(result => result.ok)).toBe(true);
      expect(results[0].value).toEqual(configs[0]);
      expect(results[1].value).toEqual(configs[1]);
      expect(results[2].value).toEqual(configs[2]);
    });

    it('should handle mixed success and failure scenarios', async () => {
      const successConfig = { ...testConfig };
      const error = new ConfigError('Config error');

      mockConfigService.getConfig
        .mockResolvedValueOnce({ ok: true, value: successConfig })
        .mockResolvedValueOnce({ ok: false, error })
        .mockResolvedValueOnce({ ok: true, value: successConfig });

      const results = await Promise.all([
        getConfig.execute(),
        getConfig.execute(),
        getConfig.execute()
      ]);

      expect(results[0].ok).toBe(true);
      expect(results[1].ok).toBe(false);
      expect(results[2].ok).toBe(true);
    });

    it('should handle config service state changes', async () => {
      // First call - config exists
      mockConfigService.getConfig.mockResolvedValueOnce({
        ok: true,
        value: testConfig
      });

      const result1 = await getConfig.execute();
      expect(result1.ok).toBe(true);

      // Second call - config service error
      const error = new ConfigError('Service unavailable');
      mockConfigService.getConfig.mockResolvedValueOnce({
        ok: false,
        error
      });

      const result2 = await getConfig.execute();
      expect(result2.ok).toBe(false);

      // Third call - config exists again
      mockConfigService.getConfig.mockResolvedValueOnce({
        ok: true,
        value: testConfig
      });

      const result3 = await getConfig.execute();
      expect(result3.ok).toBe(true);
    });
  });
}); 