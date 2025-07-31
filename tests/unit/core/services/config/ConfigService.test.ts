import { ConfigService } from '@codestate/core/services/config/ConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { IStorageService } from '@codestate/core/domain/ports/IStorageService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

// Mock dependencies
const mockStorageService: jest.Mocked<IStorageService> = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn()
};

const mockLoggerService: jest.Mocked<ILoggerService> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = new ConfigService(mockStorageService, mockLoggerService);
  });

  describe('Happy Path Tests', () => {
    it('should load valid configuration successfully', async () => {
      const validConfig = {
        theme: 'dark',
        autoSave: true,
        gitIntegration: true,
        scriptsPath: '/scripts',
        sessionsPath: '/sessions'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Config);
      expect(result.data?.theme).toBe('dark');
      expect(result.data?.autoSave).toBe(true);
      expect(mockStorageService.readFile).toHaveBeenCalledWith('/config.json');
    });

    it('should save configuration successfully', async () => {
      const config = new Config({
        theme: 'light',
        autoSave: false,
        gitIntegration: true
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.saveConfig(config);

      expect(result.success).toBe(true);
      expect(mockStorageService.writeFile).toHaveBeenCalledWith(
        '/config.json',
        JSON.stringify(config.toJSON(), null, 2)
      );
    });

    it('should create default configuration when none exists', async () => {
      mockStorageService.exists.mockResolvedValue(false);
      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Config);
      expect(mockStorageService.writeFile).toHaveBeenCalled();
    });

    it('should update configuration successfully', async () => {
      const existingConfig = new Config({
        theme: 'dark',
        autoSave: true
      });

      const updates = {
        theme: 'light',
        gitIntegration: true
      };

      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.updateConfig(existingConfig, updates);

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('light');
      expect(result.data?.autoSave).toBe(true);
      expect(result.data?.gitIntegration).toBe(true);
    });

    it('should validate configuration successfully', async () => {
      const validConfig = new Config({
        theme: 'dark',
        autoSave: true
      });

      const result = await configService.validateConfig(validConfig);

      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null configuration', async () => {
      const result = await configService.saveConfig(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should handle undefined configuration', async () => {
      const result = await configService.saveConfig(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });

    it('should handle malformed JSON in config file', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue('invalid json');

      const result = await configService.loadConfig();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle empty config file', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue('');

      const result = await configService.loadConfig();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_CONFIG');
    });

    it('should handle null updates', async () => {
      const config = new Config({ theme: 'dark' });
      const result = await configService.updateConfig(config, null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });

    it('should handle undefined updates', async () => {
      const config = new Config({ theme: 'dark' });
      const result = await configService.updateConfig(config, undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle storage read errors', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockRejectedValue(new Error('File read error'));

      const result = await configService.loadConfig();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage write errors', async () => {
      const config = new Config({ theme: 'dark' });
      mockStorageService.writeFile.mockRejectedValue(new Error('File write error'));

      const result = await configService.saveConfig(config);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage exists errors', async () => {
      mockStorageService.exists.mockRejectedValue(new Error('Exists check error'));

      const result = await configService.loadConfig();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
    });

    it('should handle circular references in config', async () => {
      const circular: any = { theme: 'dark' };
      circular.self = circular;

      const result = await configService.saveConfig(circular);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_CONFIG');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large config files', async () => {
      const largeConfig = {
        theme: 'dark',
        data: 'a'.repeat(1000000)
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(largeConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark');
    });

    it('should handle deeply nested config objects', async () => {
      const deeplyNested = (() => {
        const obj: any = {};
        let current = obj;
        for (let i = 0; i < 100; i++) {
          current.nested = {};
          current = current.nested;
        }
        return obj;
      })();

      const config = new Config({
        theme: 'dark',
        extra: deeplyNested
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.saveConfig(config);

      expect(result.success).toBe(true);
    });

    it('should handle large arrays in config', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => `item-${i}`);
      const config = new Config({
        theme: 'dark',
        extra: largeArray
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.saveConfig(config);

      expect(result.success).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in config properties', async () => {
      const configWithTypos = {
        them: 'dark', // should be 'theme'
        autoSve: true, // should be 'autoSave'
        gitIntegrtion: true // should be 'gitIntegration'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(configWithTypos));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Config);
    });

    it('should handle wrong property types in config', async () => {
      const wrongTypes = {
        theme: 123,
        autoSave: 'true',
        gitIntegration: 1
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(wrongTypes));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Config);
    });

    it('should handle missing required properties', async () => {
      const incompleteConfig = {
        // missing theme
        autoSave: true
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(incompleteConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Config);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal in config paths', async () => {
      const maliciousConfig = {
        theme: 'dark',
        scriptsPath: '../../../etc/passwd',
        sessionsPath: '..\\..\\..\\windows\\system32\\config'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(maliciousConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data?.scriptsPath).toBe('../../../etc/passwd');
      expect(result.data?.sessionsPath).toBe('..\\..\\..\\windows\\system32\\config');
    });

    it('should handle null bytes in config values', async () => {
      const nullByteConfig = {
        theme: 'dark\x00',
        scriptsPath: 'file\x00name'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(nullByteConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark\x00');
      expect(result.data?.scriptsPath).toBe('file\x00name');
    });

    it('should handle unicode control characters', async () => {
      const unicodeConfig = {
        theme: '\u0000\u0001\u0002\u0003',
        scriptsPath: '\u0000\u0001\u0002\u0003'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(unicodeConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('\u0000\u0001\u0002\u0003');
      expect(result.data?.scriptsPath).toBe('\u0000\u0001\u0002\u0003');
    });

    it('should handle script injection attempts', async () => {
      const scriptInjectionConfig = {
        theme: '<script>alert("xss")</script>',
        scriptsPath: '<script>alert("xss")</script>'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(scriptInjectionConfig));

      const result = await configService.loadConfig();

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('<script>alert("xss")</script>');
      expect(result.data?.scriptsPath).toBe('<script>alert("xss")</script>');
    });
  });

  describe('Method Tests', () => {
    it('should have loadConfig method', () => {
      expect(typeof configService.loadConfig).toBe('function');
    });

    it('should have saveConfig method', () => {
      expect(typeof configService.saveConfig).toBe('function');
    });

    it('should have updateConfig method', () => {
      expect(typeof configService.updateConfig).toBe('function');
    });

    it('should have validateConfig method', () => {
      expect(typeof configService.validateConfig).toBe('function');
    });

    it('should have resetConfig method', () => {
      expect(typeof configService.resetConfig).toBe('function');
    });

    it('should have exportConfig method', () => {
      expect(typeof configService.exportConfig).toBe('function');
    });

    it('should have importConfig method', () => {
      expect(typeof configService.importConfig).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full config lifecycle', async () => {
      // Load config
      mockStorageService.exists.mockResolvedValue(false);
      mockStorageService.writeFile.mockResolvedValue();

      const loadResult = await configService.loadConfig();
      expect(loadResult.success).toBe(true);

      // Update config
      const config = loadResult.data!;
      const updateResult = await configService.updateConfig(config, {
        theme: 'light',
        autoSave: true
      });
      expect(updateResult.success).toBe(true);

      // Save config
      const saveResult = await configService.saveConfig(updateResult.data!);
      expect(saveResult.success).toBe(true);

      // Validate config
      const validateResult = await configService.validateConfig(saveResult.data!);
      expect(validateResult.success).toBe(true);
    });

    it('should handle config with all properties', async () => {
      const fullConfig = new Config({
        theme: 'dark',
        autoSave: true,
        gitIntegration: true,
        scriptsPath: '/scripts',
        sessionsPath: '/sessions'
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await configService.saveConfig(fullConfig);

      expect(result.success).toBe(true);
      expect(result.data?.theme).toBe('dark');
      expect(result.data?.autoSave).toBe(true);
      expect(result.data?.gitIntegration).toBe(true);
      expect(result.data?.scriptsPath).toBe('/scripts');
      expect(result.data?.sessionsPath).toBe('/sessions');
    });
  });
}); 