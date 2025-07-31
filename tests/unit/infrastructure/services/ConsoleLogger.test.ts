import { ConsoleLogger } from '@codestate/infrastructure/services/ConsoleLogger';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';

// Mock console
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleDebug = jest.fn();

// Mock Date
const mockDate = new Date('2023-01-01T00:00:00.000Z');
const originalDate = global.Date;

beforeAll(() => {
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.toISOString = mockDate.toISOString;
});

afterAll(() => {
  global.Date = originalDate;
});

describe('ConsoleLogger', () => {
  let consoleLogger: ConsoleLogger;
  const testConfig: LoggerConfig = {
    level: 'LOG',
    sinks: ['console']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.console = {
      log: mockConsoleLog,
      error: mockConsoleError,
      warn: mockConsoleWarn,
      debug: mockConsoleDebug
    } as any;
  });

  describe('Happy Path Tests', () => {
    it('should create ConsoleLogger with valid config', () => {
      expect(() => {
        consoleLogger = new ConsoleLogger(testConfig);
      }).not.toThrow();
    });

    it('should log message at LOG level', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test log message';
      const meta = { userId: 123, action: 'test' };

      consoleLogger.log(message, meta);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[LOG]'),
        expect.stringContaining(message)
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(meta);
    });

    it('should log error message at ERROR level', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test error message';
      const meta = { errorCode: 'TEST_ERROR' };

      consoleLogger.error(message, meta);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining(message)
      );
      expect(mockConsoleError).toHaveBeenCalledWith(meta);
    });

    it('should log warning message at WARN level', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test warning message';

      consoleLogger.warn(message);

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        expect.stringContaining(message)
      );
    });

    it('should log debug message at DEBUG level', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test debug message';
      const meta = { debugInfo: 'test' };

      consoleLogger.debug(message, meta);

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('"level":"debug"'),
        expect.stringContaining(message)
      );
    });

    it('should include timestamp in log entries', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test message';

      consoleLogger.log(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/\[LOG\] \[2023-01-01T00:00:00\.000Z\] Test message/)
      );
    });

    it('should handle messages without meta data', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Test message without meta';

      consoleLogger.log(message);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(message)
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it('should handle different log levels correctly', () => {
      const levels: LogLevel[] = ['ERROR', 'WARN', 'LOG', 'DEBUG'];
      
      levels.forEach(level => {
        const config: LoggerConfig = { ...testConfig, level };
        const logger = new ConsoleLogger(config);
        
        logger.log('test message');
        
        if (level === 'ERROR' || level === 'WARN' || level === 'LOG') {
          expect(mockConsoleLog).toHaveBeenCalled();
        } else {
          expect(mockConsoleLog).not.toHaveBeenCalled();
        }
        
        jest.clearAllMocks();
      });
    });

    it('should handle debug level with JSON output', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const message = 'Debug message';
      const meta = { debugKey: 'debugValue' };

      consoleLogger.debug(message, meta);

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('"level":"debug"'),
        expect.stringContaining('"timestamp":"2023-01-01T00:00:00.000Z"'),
        expect.stringContaining('"message":"Debug message"'),
        expect.stringContaining('"debugKey":"debugValue"')
      );
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null message', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log(null as any);
      }).not.toThrow();
    });

    it('should handle undefined message', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log(undefined as any);
      }).not.toThrow();
    });

    it('should handle empty message', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log('');
      }).not.toThrow();
    });

    it('should handle null meta', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log('test message', null as any);
      }).not.toThrow();
    });

    it('should handle undefined meta', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log('test message', undefined as any);
      }).not.toThrow();
    });

    it('should handle invalid log level', () => {
      const invalidConfig = { ...testConfig, level: 'INVALID' as LogLevel };

      expect(() => {
        consoleLogger = new ConsoleLogger(invalidConfig);
      }).not.toThrow();
    });

    it('should handle missing config properties', () => {
      const minimalConfig = { level: 'LOG' } as LoggerConfig;

      expect(() => {
        consoleLogger = new ConsoleLogger(minimalConfig);
      }).not.toThrow();
    });
  });

  describe('Failure Tests', () => {
    it('should handle console errors gracefully', () => {
      mockConsoleLog.mockImplementation(() => {
        throw new Error('Console error');
      });

      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log('test message');
      }).not.toThrow();
    });

    it('should handle JSON serialization errors', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      
      // Create an object that can't be serialized
      const circular: any = { message: 'test' };
      circular.self = circular;

      expect(() => {
        consoleLogger.debug('test message', circular);
      }).toThrow();
    });

    it('should handle very large messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const largeMessage = 'a'.repeat(1000000);

      expect(() => {
        consoleLogger.log(largeMessage);
      }).not.toThrow();
    });

    it('should handle very large meta objects', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const largeMeta = { data: 'a'.repeat(1000000) };

      expect(() => {
        consoleLogger.log('test message', largeMeta);
      }).not.toThrow();
    });

    it('should handle console being undefined', () => {
      const originalConsole = global.console;
      global.console = undefined as any;

      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log('test message');
      }).toThrow();

      global.console = originalConsole;
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const longMessage = 'a'.repeat(100000);

      expect(() => {
        consoleLogger.log(longMessage);
      }).not.toThrow();
    });

    it('should handle unicode characters in messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const unicodeMessage = '测试中文 🚀 emoji: 测试';

      expect(() => {
        consoleLogger.log(unicodeMessage);
      }).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const specialMessage = 'Message with special chars: éñç@#$%^&*()';

      expect(() => {
        consoleLogger.log(specialMessage);
      }).not.toThrow();
    });

    it('should handle very deep nested meta objects', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const deepMeta = { level1: { level2: { level3: { level4: { level5: 'value' } } } } };

      expect(() => {
        consoleLogger.log('test message', deepMeta);
      }).not.toThrow();
    });

    it('should handle concurrent logging operations', async () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(consoleLogger.log(`Message ${i}`))
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle high frequency logging', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      
      for (let i = 0; i < 1000; i++) {
        expect(() => {
          consoleLogger.log(`Message ${i}`);
        }).not.toThrow();
      }
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in log levels', () => {
      const typoConfig = { ...testConfig, level: 'LOGG' as any };
      
      expect(() => {
        consoleLogger = new ConsoleLogger(typoConfig);
      }).not.toThrow();
    });

    it('should handle wrong parameter types', () => {
      consoleLogger = new ConsoleLogger(testConfig);

      expect(() => {
        consoleLogger.log(123 as any);
      }).not.toThrow();

      expect(() => {
        consoleLogger.log('message', 456 as any);
      }).not.toThrow();
    });

    it('should handle case sensitivity in log levels', () => {
      const caseConfig = { ...testConfig, level: 'log' as any };

      expect(() => {
        consoleLogger = new ConsoleLogger(caseConfig);
      }).not.toThrow();
    });

    it('should handle extra config properties', () => {
      const extraConfig = { ...testConfig, extraProp: 'value' } as any;

      expect(() => {
        consoleLogger = new ConsoleLogger(extraConfig);
      }).not.toThrow();
    });

    it('should handle missing sinks property', () => {
      const noSinksConfig = { level: 'LOG' } as LoggerConfig;

      expect(() => {
        consoleLogger = new ConsoleLogger(noSinksConfig);
      }).not.toThrow();
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle null bytes in messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const nullByteMessage = 'Message with \x00 null byte';

      expect(() => {
        consoleLogger.log(nullByteMessage);
      }).not.toThrow();
    });

    it('should handle control characters in messages', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const controlMessage = 'Message with \x01\x02\x03 control chars';

      expect(() => {
        consoleLogger.log(controlMessage);
      }).not.toThrow();
    });

    it('should handle script injection attempts', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const scriptMessage = '<script>alert("xss")</script>';

      expect(() => {
        consoleLogger.log(scriptMessage);
      }).not.toThrow();
    });

    it('should handle SQL injection attempts', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const sqlMessage = '; DROP TABLE users; --';

      expect(() => {
        consoleLogger.log(sqlMessage);
      }).not.toThrow();
    });

    it('should handle command injection attempts', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const commandMessage = '$(rm -rf /)';

      expect(() => {
        consoleLogger.log(commandMessage);
      }).not.toThrow();
    });

    it('should handle environment variable injection', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      const envMessage = '${PATH}';

      expect(() => {
        consoleLogger.log(envMessage);
      }).not.toThrow();
    });
  });

  describe('Method Tests', () => {
    it('should have log method', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      expect(typeof consoleLogger.log).toBe('function');
    });

    it('should have error method', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      expect(typeof consoleLogger.error).toBe('function');
    });

    it('should have warn method', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      expect(typeof consoleLogger.warn).toBe('function');
    });

    it('should have debug method', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      expect(typeof consoleLogger.debug).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full logging workflow', () => {
      consoleLogger = new ConsoleLogger(testConfig);
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
              consoleLogger.log(message, meta);
              break;
            case 'error':
              consoleLogger.error(message, meta);
              break;
            case 'warn':
              consoleLogger.warn(message, meta);
              break;
            case 'debug':
              consoleLogger.debug(message, meta);
              break;
          }
        }).not.toThrow();
      });
    });

    it('should handle multiple loggers with different levels', () => {
      const levels: LogLevel[] = ['ERROR', 'WARN', 'LOG', 'DEBUG'];
      const loggers = levels.map(level => 
        new ConsoleLogger({ ...testConfig, level })
      );

      loggers.forEach((logger, index) => {
        expect(() => {
          logger.log('test message');
        }).not.toThrow();
      });
    });

    it('should handle mixed logging scenarios', () => {
      consoleLogger = new ConsoleLogger(testConfig);
      
      // Log different types of messages
      expect(() => {
        consoleLogger.log('Regular log message');
        consoleLogger.error('Error message', { errorCode: 'ERR001' });
        consoleLogger.warn('Warning message');
        consoleLogger.debug('Debug message', { debugInfo: 'test' });
      }).not.toThrow();
    });
  });
}); 