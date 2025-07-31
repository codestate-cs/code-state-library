import { ConfigService } from '@codestate/core/services/config/ConfigService';
import { IConfigRepository } from '@codestate/core/domain/ports/IConfigService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result, isSuccess, isFailure } from '@codestate/core/domain/models/Result';

// Mock logger
const mockLogger: ILoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  plainLog: jest.fn(),
};

// Mock repository
const mockRepository: IConfigRepository = {
  load: jest.fn(),
  save: jest.fn(),
};

describe('ConfigService', () => {
  let configService: ConfigService;
  let mockRepo: jest.Mocked<IConfigRepository>;
  let mockLog: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = mockRepository as jest.Mocked<IConfigRepository>;
    mockLog = mockLogger as jest.Mocked<ILoggerService>;
    configService = new ConfigService(mockRepo, mockLog);
  });

  describe('getConfig', () => {
    const validConfig: Config = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: {
        enabled: false,
      },
      storagePath: '/data',
      logger: {
        level: 'LOG',
        sinks: ['console'],
      },
      experimental: {},
      extensions: {},
    };

    describe('Happy Path', () => {
      it('should get config successfully', async () => {
        mockRepo.load.mockResolvedValue({ ok: true, value: validConfig });

        const result = await configService.getConfig();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual(validConfig);
        }
        expect(mockRepo.load).toHaveBeenCalled();
        expect(mockLog.debug).toHaveBeenCalledWith('ConfigService.getConfig called');
        expect(mockLog.log).toHaveBeenCalledWith('Config loaded', {});
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.load.mockResolvedValue({ ok: false, error });

        const result = await configService.getConfig();

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to get config', { error });
      });

      it('should handle repository throwing exception', async () => {
        const error = new Error('Unexpected error');
        mockRepo.load.mockRejectedValue(error);

        await expect(configService.getConfig()).rejects.toThrow('Unexpected error');
      });
    });

    describe('Invalid Input', () => {
      it('should handle corrupted config data', async () => {
        const corruptedConfig = { invalid: 'data' } as any;
        mockRepo.load.mockResolvedValue({ ok: true, value: corruptedConfig });

        const result = await configService.getConfig();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual(corruptedConfig);
        }
      });
    });

    describe('Malicious Input', () => {
      it('should handle config with malicious paths', async () => {
        const maliciousConfig: Config = {
          ...validConfig,
          storagePath: '../../../etc/passwd',
        };
        mockRepo.load.mockResolvedValue({ ok: true, value: maliciousConfig });

        const result = await configService.getConfig();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.storagePath).toBe('../../../etc/passwd');
        }
      });
    });
  });

  describe('setConfig', () => {
    const validConfig: Config = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: {
        enabled: false,
      },
      storagePath: '/data',
      logger: {
        level: 'LOG',
        sinks: ['console'],
      },
      experimental: {},
      extensions: {},
    };

    describe('Happy Path', () => {
      it('should set config successfully', async () => {
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.setConfig(validConfig);

        expect(result.ok).toBe(true);
        expect(mockRepo.save).toHaveBeenCalledWith(validConfig);
        expect(mockLog.debug).toHaveBeenCalledWith('ConfigService.setConfig called');
        expect(mockLog.log).toHaveBeenCalledWith('Config saved', {});
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.save.mockResolvedValue({ ok: false, error });

        const result = await configService.setConfig(validConfig);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to save config', { error });
      });

      it('should handle repository throwing exception', async () => {
        const error = new Error('Unexpected error');
        mockRepo.save.mockRejectedValue(error);

        await expect(configService.setConfig(validConfig)).rejects.toThrow('Unexpected error');
      });
    });

    describe('Invalid Input', () => {
      it('should handle config with missing required fields', async () => {
        const invalidConfig = {
          version: '1.0.0',
          // Missing ide, encryption, storagePath, logger
        } as any;
        mockRepo.save.mockResolvedValue({ ok: false, error: new Error('Invalid config') });

        const result = await configService.setConfig(invalidConfig);

        expect(result.ok).toBe(false);
      });

      it('should handle null config', async () => {
        mockRepo.save.mockResolvedValue({ ok: false, error: new Error('Null config') });

        const result = await configService.setConfig(null as any);

        expect(result.ok).toBe(false);
      });
    });

    describe('Malicious Input', () => {
      it('should handle config with path traversal', async () => {
        const maliciousConfig: Config = {
          ...validConfig,
          storagePath: '../../../etc/passwd',
        };
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.setConfig(maliciousConfig);

        expect(result.ok).toBe(true);
        expect(mockRepo.save).toHaveBeenCalledWith(maliciousConfig);
      });

      it('should handle config with SQL injection in paths', async () => {
        const maliciousConfig: Config = {
          ...validConfig,
          storagePath: "'; DROP TABLE users; --",
        };
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.setConfig(maliciousConfig);

        expect(result.ok).toBe(true);
        expect(mockRepo.save).toHaveBeenCalledWith(maliciousConfig);
      });
    });
  });

  describe('updateConfig', () => {
    const existingConfig: Config = {
      version: '1.0.0',
      ide: 'vscode',
      encryption: {
        enabled: false,
      },
      storagePath: '/data',
      logger: {
        level: 'LOG',
        sinks: ['console'],
      },
      experimental: {},
      extensions: {},
    };

    const partialUpdate = {
      logger: {
        level: 'DEBUG' as const,
        sinks: ['file', 'console'] as ('file' | 'console')[],
      },
    };

    describe('Happy Path', () => {
      it('should update config successfully', async () => {
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig(partialUpdate);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.logger.level).toBe('DEBUG');
          expect(result.value.logger.sinks).toEqual(['file', 'console']);
          expect(result.value.storagePath).toEqual(existingConfig.storagePath);
        }
        expect(mockRepo.load).toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalledWith({
          ...existingConfig,
          ...partialUpdate,
        });
        expect(mockLog.log).toHaveBeenCalledWith('Config updated', {});
      });

      it('should handle empty partial update', async () => {
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig({});

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual(existingConfig);
        }
      });
    });

    describe('Error Cases', () => {
      it('should handle load error', async () => {
        const error = new Error('Load error');
        mockRepo.load.mockResolvedValue({ ok: false, error });

        const result = await configService.updateConfig(partialUpdate);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to load config for update', { error });
      });

      it('should handle save error', async () => {
        const error = new Error('Save error');
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: false, error });

        const result = await configService.updateConfig(partialUpdate);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to save updated config', { error });
      });

      it('should handle repository throwing exception during load', async () => {
        const error = new Error('Unexpected error');
        mockRepo.load.mockRejectedValue(error);

        await expect(configService.updateConfig(partialUpdate)).rejects.toThrow('Unexpected error');
      });
    });

    describe('Invalid Input', () => {
      it('should handle partial update with invalid data', async () => {
        const invalidUpdate = {
          logger: {
            level: 'INVALID_LEVEL' as any,
            sinks: 'not_an_array',
          },
        } as any;
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: false, error: new Error('Invalid update') });

        const result = await configService.updateConfig(invalidUpdate);

        expect(result.ok).toBe(false);
      });

      it('should handle null partial update', async () => {
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: false, error: new Error('Null update') });

        const result = await configService.updateConfig(null as any);

        expect(result.ok).toBe(false);
      });
    });

    describe('Malicious Input', () => {
      it('should handle partial update with path traversal', async () => {
        const maliciousUpdate = {
          storagePath: '../../../etc/passwd',
        };
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig(maliciousUpdate);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.storagePath).toBe('../../../etc/passwd');
        }
      });

      it('should handle partial update with XSS in paths', async () => {
        const maliciousUpdate = {
          storagePath: '<script>alert("xss")</script>',
        };
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig(maliciousUpdate);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.storagePath).toBe('<script>alert("xss")</script>');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle deep nested updates', async () => {
        const deepUpdate = {
          experimental: {
            newFeature: true,
            betaMode: false,
          },
        };
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig(deepUpdate);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.experimental?.newFeature).toBe(true);
          expect(result.value.experimental?.betaMode).toBe(false);
        }
      });

      it('should handle updates with undefined values', async () => {
        const updateWithUndefined = {
          logger: {
            level: undefined,
            sinks: undefined,
          },
        } as any;
        mockRepo.load.mockResolvedValue({ ok: true, value: existingConfig });
        mockRepo.save.mockResolvedValue({ ok: true, value: undefined });

        const result = await configService.updateConfig(updateWithUndefined);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value.logger.level).toBeUndefined();
          expect(result.value.logger.sinks).toBeUndefined();
        }
      });
    });
  });
}); 