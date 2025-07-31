import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';

// Mock fs
const mockAppendFileSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.mock('fs', () => ({
  appendFileSync: mockAppendFileSync,
  mkdirSync: mockMkdirSync
}));

jest.mock('path', () => ({
  dirname: jest.fn((path) => path.substring(0, path.lastIndexOf('/')))
}));

describe('FileLogger', () => {
  let fileLogger: FileLogger;
  const testConfig: LoggerConfig = {
    level: 'LOG',
    sinks: ['file'],
    filePath: '/tmp/test.log'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppendFileSync.mockImplementation(() => {});
    mockMkdirSync.mockImplementation(() => {});
  });

  describe('Happy Path Tests', () => {
    it('should create FileLogger with valid config', () => {
      expect(() => {
        fileLogger = new FileLogger(testConfig);
      }).not.toThrow();
    });

    it('should log message at LOG level', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test log message';
      const meta = { userId: 123, action: 'test' };

      fileLogger.log(message, meta);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"level":"log"'),
        { encoding: 'utf8' }
      );
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining(message),
        { encoding: 'utf8' }
      );
    });

    it('should log error message at ERROR level', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test error message';
      const meta = { errorCode: 'TEST_ERROR' };

      fileLogger.error(message, meta);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"level":"error"'),
        { encoding: 'utf8' }
      );
    });

    it('should log warning message at WARN level', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test warning message';

      fileLogger.warn(message);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"level":"warn"'),
        { encoding: 'utf8' }
      );
    });

    it('should log debug message at DEBUG level', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test debug message';

      fileLogger.debug(message);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"level":"debug"'),
        { encoding: 'utf8' }
      );
    });

    it('should include timestamp in log entries', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test message';

      fileLogger.log(message);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringMatching(/"timestamp":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/),
        { encoding: 'utf8' }
      );
    });

    it('should include meta data in log entries', () => {
      fileLogger = new FileLogger(testConfig);
      const message = 'Test message';
      const meta = { key1: 'value1', key2: 123 };

      fileLogger.log(message, meta);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"key1":"value1"'),
        { encoding: 'utf8' }
      );
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        testConfig.filePath,
        expect.stringContaining('"key2":123'),
        { encoding: 'utf8' }
      );
    });

    it('should create log directory if it does not exist', () => {
      fileLogger = new FileLogger(testConfig);

      expect(mockMkdirSync).toHaveBeenCalledWith('/tmp', { recursive: true });
    });

    it('should handle different log levels correctly', () => {
      const levels: LogLevel[] = ['ERROR', 'WARN', 'LOG', 'DEBUG'];
      
      levels.forEach(level => {
        const config: LoggerConfig = { ...testConfig, level };
        const logger = new FileLogger(config);
        
        logger.log('test message');
        
        if (level === 'ERROR' || level === 'WARN' || level === 'LOG') {
          expect(mockAppendFileSync).toHaveBeenCalled();
        } else {
          expect(mockAppendFileSync).not.toHaveBeenCalled();
        }
        
        jest.clearAllMocks();
      });
    });
  });

  describe('Invalid Input Tests', () => {
    it('should throw error when filePath is missing', () => {
      const invalidConfig = { level: 'LOG', sinks: ['file'] } as LoggerConfig;

      expect(() => {
        new FileLogger(invalidConfig);
      }).toThrow('FileLogger requires filePath in LoggerConfig');
    });

    it('should handle null message', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log(null as any);
      }).not.toThrow();
    });

    it('should handle undefined message', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log(undefined as any);
      }).not.toThrow();
    });

    it('should handle empty message', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log('');
      }).not.toThrow();
    });

    it('should handle null meta', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log('test message', null as any);
      }).not.toThrow();
    });

    it('should handle undefined meta', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log('test message', undefined as any);
      }).not.toThrow();
    });

    it('should handle invalid log level', () => {
      const invalidConfig = { ...testConfig, level: 'INVALID' as LogLevel };

      expect(() => {
        new FileLogger(invalidConfig);
      }).not.toThrow();
    });
  });

  describe('Failure Tests', () => {
    it('should handle file system errors gracefully', () => {
      mockAppendFileSync.mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });

      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log('test message');
      }).not.toThrow();
    });

    it('should handle directory creation errors gracefully', () => {
      mockMkdirSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => {
        fileLogger = new FileLogger(testConfig);
      }).not.toThrow();
    });

    it('should handle JSON serialization errors', () => {
      fileLogger = new FileLogger(testConfig);
      
      // Create an object that can't be serialized
      const circular: any = { message: 'test' };
      circular.self = circular;

      expect(() => {
        fileLogger.log('test message', circular);
      }).toThrow();
    });

    it('should handle very large messages', () => {
      fileLogger = new FileLogger(testConfig);
      const largeMessage = 'a'.repeat(1000000);

      expect(() => {
        fileLogger.log(largeMessage);
      }).not.toThrow();
    });

    it('should handle very large meta objects', () => {
      fileLogger = new FileLogger(testConfig);
      const largeMeta = { data: 'a'.repeat(1000000) };

      expect(() => {
        fileLogger.log('test message', largeMeta);
      }).not.toThrow();
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long file paths', () => {
      const longPath = '/path/' + 'a'.repeat(1000) + '/test.log';
      const config: LoggerConfig = { ...testConfig, filePath: longPath };

      expect(() => {
        fileLogger = new FileLogger(config);
      }).not.toThrow();
    });

    it('should handle unicode characters in messages', () => {
      fileLogger = new FileLogger(testConfig);
      const unicodeMessage = '测试中文 🚀 emoji: 测试';

      expect(() => {
        fileLogger.log(unicodeMessage);
      }).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      fileLogger = new FileLogger(testConfig);
      const specialMessage = 'Message with special chars: éñç@#$%^&*()';

      expect(() => {
        fileLogger.log(specialMessage);
      }).not.toThrow();
    });

    it('should handle very deep nested meta objects', () => {
      fileLogger = new FileLogger(testConfig);
      const deepMeta = { level1: { level2: { level3: { level4: { level5: 'value' } } } } };

      expect(() => {
        fileLogger.log('test message', deepMeta);
      }).not.toThrow();
    });

    it('should handle concurrent logging operations', async () => {
      fileLogger = new FileLogger(testConfig);
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(fileLogger.log(`Message ${i}`))
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in log levels', () => {
      const typoConfig = { ...testConfig, level: 'LOGG' as any };
      
      expect(() => {
        fileLogger = new FileLogger(typoConfig);
      }).not.toThrow();
    });

    it('should handle wrong parameter types', () => {
      fileLogger = new FileLogger(testConfig);

      expect(() => {
        fileLogger.log(123 as any);
      }).not.toThrow();

      expect(() => {
        fileLogger.log('message', 456 as any);
      }).not.toThrow();
    });

    it('should handle missing file extensions', () => {
      const noExtensionConfig = { ...testConfig, filePath: '/tmp/test' };

      expect(() => {
        fileLogger = new FileLogger(noExtensionConfig);
      }).not.toThrow();
    });

    it('should handle relative paths', () => {
      const relativeConfig = { ...testConfig, filePath: './test.log' };

      expect(() => {
        fileLogger = new FileLogger(relativeConfig);
      }).not.toThrow();
    });

    it('should handle case sensitivity in file paths', () => {
      const caseConfig = { ...testConfig, filePath: '/TMP/TEST.LOG' };

      expect(() => {
        fileLogger = new FileLogger(caseConfig);
      }).not.toThrow();
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle null bytes in messages', () => {
      fileLogger = new FileLogger(testConfig);
      const nullByteMessage = 'Message with \x00 null byte';

      expect(() => {
        fileLogger.log(nullByteMessage);
      }).not.toThrow();
    });

    it('should handle control characters in messages', () => {
      fileLogger = new FileLogger(testConfig);
      const controlMessage = 'Message with \x01\x02\x03 control chars';

      expect(() => {
        fileLogger.log(controlMessage);
      }).not.toThrow();
    });

    it('should handle script injection attempts', () => {
      fileLogger = new FileLogger(testConfig);
      const scriptMessage = '<script>alert("xss")</script>';

      expect(() => {
        fileLogger.log(scriptMessage);
      }).not.toThrow();
    });

    it('should handle SQL injection attempts', () => {
      fileLogger = new FileLogger(testConfig);
      const sqlMessage = '; DROP TABLE users; --';

      expect(() => {
        fileLogger.log(sqlMessage);
      }).not.toThrow();
    });

    it('should handle path traversal attempts in file paths', () => {
      const maliciousConfig = { ...testConfig, filePath: '../../../etc/passwd' };

      expect(() => {
        fileLogger = new FileLogger(maliciousConfig);
      }).not.toThrow();
    });

    it('should handle command injection attempts', () => {
      fileLogger = new FileLogger(testConfig);
      const commandMessage = '$(rm -rf /)';

      expect(() => {
        fileLogger.log(commandMessage);
      }).not.toThrow();
    });
  });

  describe('Method Tests', () => {
    it('should have log method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(typeof fileLogger.log).toBe('function');
    });

    it('should have error method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(typeof fileLogger.error).toBe('function');
    });

    it('should have warn method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(typeof fileLogger.warn).toBe('function');
    });

    it('should have debug method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(typeof fileLogger.debug).toBe('function');
    });

    it('should have plainLog method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(typeof fileLogger.plainLog).toBe('function');
    });

    it('should throw error for plainLog method', () => {
      fileLogger = new FileLogger(testConfig);
      expect(() => {
        fileLogger.plainLog('test message');
      }).toThrow('Method not implemented.');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full logging workflow', () => {
      fileLogger = new FileLogger(testConfig);
      const messages = [
        { level: 'log', message: 'Info message', meta: { userId: 123 } },
        { level: 'error', message: 'Error message', meta: { errorCode: 'TEST_ERROR' } },
        { level: 'warn', message: 'Warning message' },
        { level: 'debug', message: 'Debug message', meta: { debugInfo: 'test' } }
      ];

      messages.forEach(({ level, message, meta }) => {
        expect(() => {
          switch (level) {
            case 'log':
              fileLogger.log(message, meta);
              break;
            case 'error':
              fileLogger.error(message, meta);
              break;
            case 'warn':
              fileLogger.warn(message, meta);
              break;
            case 'debug':
              fileLogger.debug(message, meta);
              break;
          }
        }).not.toThrow();
      });
    });

    it('should handle multiple loggers with different levels', () => {
      const levels: LogLevel[] = ['ERROR', 'WARN', 'LOG', 'DEBUG'];
      const loggers = levels.map(level => 
        new FileLogger({ ...testConfig, level })
      );

      loggers.forEach((logger, index) => {
        expect(() => {
          logger.log('test message');
        }).not.toThrow();
      });
    });
  });
}); 