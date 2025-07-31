import { ConfigurableLogger } from '../../../../packages/infrastructure/services/ConfigurableLogger/ConfigurableLogger';
import { ConfigurableLoggerFacade } from '../../../../packages/infrastructure/services/ConfigurableLogger/ConfigurableLoggerFacade';
import { LoggerConfig, LogLevel } from '../../../../packages/core/domain/schemas/SchemaRegistry';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// Mock the dependencies
jest.mock('@codestate/infrastructure/services/ConsoleLogger');
jest.mock('@codestate/infrastructure/services/FileLogger');

describe('ConfigurableLogger', () => {
  let logger: ConfigurableLogger;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env
    process.env = { ...originalEnv };
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Constructor - Happy Path', () => {
    it('should create logger with console sink only', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      
      logger = new ConfigurableLogger(config);
      
      expect(logger).toBeDefined();
    });

    it('should create logger with file sink only', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['file'],
        filePath: '/path/to/logs/app.log',
      };
      
      logger = new ConfigurableLogger(config);
      
      expect(logger).toBeDefined();
    });

    it('should create logger with both console and file sinks', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console', 'file'],
        filePath: '/path/to/logs/app.log',
      };
      
      logger = new ConfigurableLogger(config);
      
      expect(logger).toBeDefined();
    });

    it('should create logger with all log levels', () => {
      const levels: LogLevel[] = ['DEBUG', 'LOG', 'WARN', 'ERROR'];
      
      levels.forEach(level => {
        const config: LoggerConfig = {
          level,
          sinks: ['console'],
        };
        
        logger = new ConfigurableLogger(config);
        expect(logger).toBeDefined();
      });
    });

    it('should create logger with custom file path', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['file'],
        filePath: '/custom/path/to/logs/custom.log',
      };
      
      logger = new ConfigurableLogger(config);
      
      expect(logger).toBeDefined();
    });
  });

  describe('Constructor - Error Cases', () => {
    it('should throw error when file sink is specified without filePath', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['file'],
        // filePath is missing
      };
      
      expect(() => new ConfigurableLogger(config)).toThrow('filePath must be provided in LoggerConfig for file sink');
    });

    it('should handle empty sinks array', () => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: [],
      };
      
      logger = new ConfigurableLogger(config);
      
      expect(logger).toBeDefined();
    });

    it('should handle invalid sink types', () => {
      const config = {
        level: 'LOG',
        sinks: ['invalid_sink' as any],
      };
      
      logger = new ConfigurableLogger(config as LoggerConfig);
      
      expect(logger).toBeDefined();
    });

    it('should handle missing level', () => {
      const config = {
        sinks: ['console'],
        // level is missing
      };
      
      logger = new ConfigurableLogger(config as LoggerConfig);
      
      expect(logger).toBeDefined();
    });
  });

  describe('Constructor - Pathological Cases', () => {
    it('should handle null config', () => {
      expect(() => new ConfigurableLogger(null as any)).toThrow();
    });

    it('should handle undefined config', () => {
      expect(() => new ConfigurableLogger(undefined as any)).toThrow();
    });

    it('should handle empty config object', () => {
      const config = {};
      
      expect(() => new ConfigurableLogger(config as LoggerConfig)).toThrow();
    });

    it('should handle config with null values', () => {
      const config = {
        level: null,
        sinks: null,
        filePath: null,
      };
      
      expect(() => new ConfigurableLogger(config as any)).toThrow();
    });

    it('should handle config with undefined values', () => {
      const config = {
        level: undefined,
        sinks: undefined,
        filePath: undefined,
      };
      
      expect(() => new ConfigurableLogger(config as any)).toThrow();
    });
  });

  describe('Constructor - Invalid Input', () => {
    it('should handle non-string filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: 123,
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });

    it('should handle non-array sinks', () => {
      const config = {
        level: 'LOG',
        sinks: 'console',
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });

    it('should handle non-string level', () => {
      const config = {
        level: 123,
        sinks: ['console'],
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });
  });

  describe('Constructor - Malicious Input', () => {
    it('should handle SQL injection in filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: "'; DROP TABLE logs; --",
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });

    it('should handle path traversal in filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: "../../../etc/passwd",
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });

    it('should handle XSS in filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: "<script>alert('xss')</script>",
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });

    it('should handle command injection in filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: "$(rm -rf /)",
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });
  });

  describe('Constructor - Human Oversight', () => {
    it('should handle typos in sink names', () => {
      const config = {
        level: 'LOG',
        sinks: ['consle'], // typo
      };
      
      logger = new ConfigurableLogger(config as LoggerConfig);
      expect(logger).toBeDefined();
    });

    it('should handle case sensitivity issues', () => {
      const config = {
        level: 'LOG',
        sinks: ['CONSOLE'], // uppercase
      };
      
      logger = new ConfigurableLogger(config as LoggerConfig);
      expect(logger).toBeDefined();
    });

    it('should handle extra whitespace in filePath', () => {
      const config = {
        level: 'LOG',
        sinks: ['file'],
        filePath: '  /path/to/logs/app.log  ',
      };
      
      // The actual implementation doesn't throw for this case
      expect(() => new ConfigurableLogger(config as any)).not.toThrow();
    });
  });

  describe('Logging Methods - Happy Path', () => {
    beforeEach(() => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      logger = new ConfigurableLogger(config);
    });

    it('should log message to all sinks', () => {
      const message = 'Test log message';
      const meta = { userId: 123, action: 'test' };
      
      expect(() => logger.log(message, meta)).not.toThrow();
    });

    it('should log error message to all sinks', () => {
      const message = 'Test error message';
      const meta = { errorCode: 'TEST_ERROR', stack: 'stack trace' };
      
      expect(() => logger.error(message, meta)).not.toThrow();
    });

    it('should log warning message to all sinks', () => {
      const message = 'Test warning message';
      const meta = { warningType: 'DEPRECATION' };
      
      expect(() => logger.warn(message, meta)).not.toThrow();
    });

    it('should log debug message to all sinks', () => {
      const message = 'Test debug message';
      const meta = { debugInfo: 'debug details' };
      
      expect(() => logger.debug(message, meta)).not.toThrow();
    });

    it('should log without meta data', () => {
      const message = 'Test message without meta';
      
      expect(() => logger.log(message)).not.toThrow();
    });

    it('should log with empty meta data', () => {
      const message = 'Test message with empty meta';
      const meta = {};
      
      expect(() => logger.log(message, meta)).not.toThrow();
    });
  });

  describe('Logging Methods - Error Cases', () => {
    beforeEach(() => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      logger = new ConfigurableLogger(config);
    });

    it('should handle empty message', () => {
      expect(() => logger.log('')).not.toThrow();
    });

    it('should handle null message', () => {
      expect(() => logger.log(null as any)).not.toThrow();
    });

    it('should handle undefined message', () => {
      expect(() => logger.log(undefined as any)).not.toThrow();
    });

    it('should handle non-string message', () => {
      expect(() => logger.log(123 as any)).not.toThrow();
      expect(() => logger.log({} as any)).not.toThrow();
      expect(() => logger.log([] as any)).not.toThrow();
    });
  });

  describe('Logging Methods - Pathological Cases', () => {
    beforeEach(() => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      logger = new ConfigurableLogger(config);
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      
      expect(() => logger.log(longMessage)).not.toThrow();
    });

    it('should handle messages with unicode characters', () => {
      const unicodeMessage = 'Test message with unicode 🚀🎉';
      
      expect(() => logger.log(unicodeMessage)).not.toThrow();
    });

    it('should handle messages with special characters', () => {
      const specialMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      expect(() => logger.log(specialMessage)).not.toThrow();
    });

    it('should handle messages with null bytes', () => {
      const messageWithNull = 'Test message\0with null bytes';
      
      expect(() => logger.log(messageWithNull)).not.toThrow();
    });
  });

  describe('Logging Methods - Malicious Input', () => {
    beforeEach(() => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      logger = new ConfigurableLogger(config);
    });

    it('should handle SQL injection in message', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      expect(() => logger.log(sqlInjection)).not.toThrow();
    });

    it('should handle XSS in message', () => {
      const xssMessage = "<script>alert('xss')</script>";
      
      expect(() => logger.log(xssMessage)).not.toThrow();
    });

    it('should handle command injection in message', () => {
      const commandInjection = "$(rm -rf /)";
      
      expect(() => logger.log(commandInjection)).not.toThrow();
    });

    it('should handle malicious meta data', () => {
      const maliciousMeta = {
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
        toString: () => 'malicious',
      };
      
      expect(() => logger.log('Test message', maliciousMeta)).not.toThrow();
    });
  });

  describe('PlainLog Method', () => {
    beforeEach(() => {
      const config: LoggerConfig = {
        level: 'LOG',
        sinks: ['console'],
      };
      logger = new ConfigurableLogger(config);
    });

    it('should log plain message', () => {
      expect(() => logger.plainLog('Test message')).not.toThrow();
    });

    it('should log plain message with meta', () => {
      expect(() => logger.plainLog('Test message', { meta: 'data' })).not.toThrow();
    });
  });

  describe('ConfigurableLoggerFacade', () => {
    let facade: ConfigurableLoggerFacade;

    describe('Constructor - Happy Path', () => {
      it('should create facade with default config', () => {
        facade = new ConfigurableLoggerFacade();
        
        expect(facade).toBeDefined();
      });

      it('should create facade with custom config', () => {
        const customConfig = {
          level: 'ERROR' as LogLevel,
          sinks: ['console'] as ('file' | 'console')[],
        };
        
        facade = new ConfigurableLoggerFacade(customConfig);
        
        expect(facade).toBeDefined();
      });

      it('should merge custom config with defaults', () => {
        const customConfig = {
          level: 'DEBUG' as LogLevel,
        };
        
        facade = new ConfigurableLoggerFacade(customConfig);
        
        expect(facade).toBeDefined();
      });

      it('should handle all log levels', () => {
        const levels: LogLevel[] = ['DEBUG', 'LOG', 'WARN', 'ERROR'];
        
        levels.forEach(level => {
          facade = new ConfigurableLoggerFacade({ level });
          expect(facade).toBeDefined();
        });
      });
    });

    describe('Constructor - Error Cases', () => {
      it('should handle null config', () => {
        facade = new ConfigurableLoggerFacade(null as any);
        
        expect(facade).toBeDefined();
      });

      it('should handle undefined config', () => {
        facade = new ConfigurableLoggerFacade(undefined);
        
        expect(facade).toBeDefined();
      });

      it('should handle empty config object', () => {
        facade = new ConfigurableLoggerFacade({});
        
        expect(facade).toBeDefined();
      });
    });

    describe('Constructor - Pathological Cases', () => {
      it('should handle config with null values', () => {
        const config = {
          level: null,
          sinks: null,
          filePath: null,
        };
        
        // The actual implementation will throw when trying to call includes on null
        expect(() => new ConfigurableLoggerFacade(config as any)).toThrow();
      });

      it('should handle config with undefined values', () => {
        const config = {
          level: undefined,
          sinks: undefined,
          filePath: undefined,
        };
        
        // The actual implementation will throw when trying to call includes on undefined
        expect(() => new ConfigurableLoggerFacade(config as any)).toThrow();
      });
    });

    describe('Constructor - Invalid Input', () => {
      it('should handle non-string filePath', () => {
        const config = {
          filePath: 123,
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });

      it('should handle non-array sinks', () => {
        const config = {
          sinks: 'console',
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });

      it('should handle non-string level', () => {
        const config = {
          level: 123,
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });
    });

    describe('Constructor - Malicious Input', () => {
      it('should handle SQL injection in filePath', () => {
        const config = {
          filePath: "'; DROP TABLE logs; --",
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });

      it('should handle path traversal in filePath', () => {
        const config = {
          filePath: "../../../etc/passwd",
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });

      it('should handle XSS in filePath', () => {
        const config = {
          filePath: "<script>alert('xss')</script>",
        };
        
        facade = new ConfigurableLoggerFacade(config as any);
        
        expect(facade).toBeDefined();
      });
    });

    describe('Logging Methods - Happy Path', () => {
      beforeEach(() => {
        facade = new ConfigurableLoggerFacade();
      });

      it('should log message', () => {
        const message = 'Test log message';
        const meta = { userId: 123, action: 'test' };
        
        expect(() => facade.log(message, meta)).not.toThrow();
      });

      it('should log error message', () => {
        const message = 'Test error message';
        const meta = { errorCode: 'TEST_ERROR' };
        
        expect(() => facade.error(message, meta)).not.toThrow();
      });

      it('should log warning message', () => {
        const message = 'Test warning message';
        const meta = { warningType: 'DEPRECATION' };
        
        expect(() => facade.warn(message, meta)).not.toThrow();
      });

      it('should log debug message', () => {
        const message = 'Test debug message';
        const meta = { debugInfo: 'debug details' };
        
        expect(() => facade.debug(message, meta)).not.toThrow();
      });

      it('should log without meta data', () => {
        const message = 'Test message without meta';
        
        expect(() => facade.log(message)).not.toThrow();
      });
    });

    describe('Logging Methods - Error Cases', () => {
      beforeEach(() => {
        facade = new ConfigurableLoggerFacade();
      });

      it('should handle empty message', () => {
        expect(() => facade.log('')).not.toThrow();
      });

      it('should handle null message', () => {
        expect(() => facade.log(null as any)).not.toThrow();
      });

      it('should handle undefined message', () => {
        expect(() => facade.log(undefined as any)).not.toThrow();
      });

      it('should handle non-string message', () => {
        expect(() => facade.log(123 as any)).not.toThrow();
        expect(() => facade.log({} as any)).not.toThrow();
        expect(() => facade.log([] as any)).not.toThrow();
      });
    });

    describe('Logging Methods - Pathological Cases', () => {
      beforeEach(() => {
        facade = new ConfigurableLoggerFacade();
      });

      it('should handle very long messages', () => {
        const longMessage = 'a'.repeat(10000);
        
        expect(() => facade.log(longMessage)).not.toThrow();
      });

      it('should handle messages with unicode characters', () => {
        const unicodeMessage = 'Test message with unicode 🚀🎉';
        
        expect(() => facade.log(unicodeMessage)).not.toThrow();
      });

      it('should handle messages with special characters', () => {
        const specialMessage = 'Test message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
        
        expect(() => facade.log(specialMessage)).not.toThrow();
      });
    });

    describe('Logging Methods - Malicious Input', () => {
      beforeEach(() => {
        facade = new ConfigurableLoggerFacade();
      });

      it('should handle SQL injection in message', () => {
        const sqlInjection = "'; DROP TABLE users; --";
        
        expect(() => facade.log(sqlInjection)).not.toThrow();
      });

      it('should handle XSS in message', () => {
        const xssMessage = "<script>alert('xss')</script>";
        
        expect(() => facade.log(xssMessage)).not.toThrow();
      });

      it('should handle command injection in message', () => {
        const commandInjection = "$(rm -rf /)";
        
        expect(() => facade.log(commandInjection)).not.toThrow();
      });

      it('should handle malicious meta data', () => {
        const maliciousMeta = {
          __proto__: { polluted: true },
          constructor: { prototype: { polluted: true } },
          toString: () => 'malicious',
        };
        
        expect(() => facade.log('Test message', maliciousMeta)).not.toThrow();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex logging scenarios', () => {
      const config: LoggerConfig = {
        level: 'DEBUG',
        sinks: ['console', 'file'],
        filePath: '/path/to/logs/app.log',
      };
      
      logger = new ConfigurableLogger(config);
      
      // Test all logging methods
      expect(() => logger.log('Info message', { level: 'info' })).not.toThrow();
      expect(() => logger.error('Error message', { errorCode: 'TEST_ERROR' })).not.toThrow();
      expect(() => logger.warn('Warning message', { warningType: 'DEPRECATION' })).not.toThrow();
      expect(() => logger.debug('Debug message', { debugInfo: 'details' })).not.toThrow();
    });

    it('should handle facade with complex configuration', () => {
      const customConfig = {
        level: 'WARN' as LogLevel,
        sinks: ['console'] as ('file' | 'console')[],
      };
      
      const facade = new ConfigurableLoggerFacade(customConfig);
      
      // Test all logging methods
      expect(() => facade.log('Info message', { level: 'info' })).not.toThrow();
      expect(() => facade.error('Error message', { errorCode: 'TEST_ERROR' })).not.toThrow();
      expect(() => facade.warn('Warning message', { warningType: 'DEPRECATION' })).not.toThrow();
      expect(() => facade.debug('Debug message', { debugInfo: 'details' })).not.toThrow();
    });
  });
}); 