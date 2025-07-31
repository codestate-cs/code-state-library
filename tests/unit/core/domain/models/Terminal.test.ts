import { Terminal } from '@codestate/core/domain/models/Terminal';

describe('Terminal Model', () => {
  describe('Happy Path Tests', () => {
    it('should create a valid terminal with all properties', () => {
      const validTerminal = {
        id: 'terminal-1',
        name: 'Main Terminal',
        type: 'bash',
        isAvailable: true,
        currentDirectory: '/home/user/project',
        environment: {
          PATH: '/usr/bin:/usr/local/bin',
          HOME: '/home/user',
          USER: 'user'
        },
        history: ['ls -la', 'cd /home/user', 'git status'],
        output: 'Last login: Mon Aug 14 10:30:00 on ttys000',
        isRunning: true,
        processId: 12345
      };

      const terminal = new Terminal(validTerminal);
      
      expect(terminal.id).toBe('terminal-1');
      expect(terminal.name).toBe('Main Terminal');
      expect(terminal.type).toBe('bash');
      expect(terminal.isAvailable).toBe(true);
      expect(terminal.currentDirectory).toBe('/home/user/project');
      expect(terminal.environment).toEqual({
        PATH: '/usr/bin:/usr/local/bin',
        HOME: '/home/user',
        USER: 'user'
      });
      expect(terminal.history).toEqual(['ls -la', 'cd /home/user', 'git status']);
      expect(terminal.output).toBe('Last login: Mon Aug 14 10:30:00 on ttys000');
      expect(terminal.isRunning).toBe(true);
      expect(terminal.processId).toBe(12345);
    });

    it('should create terminal with minimal properties', () => {
      const minimalTerminal = {
        id: 'minimal-terminal',
        name: 'Minimal Terminal',
        isAvailable: false
      };

      const terminal = new Terminal(minimalTerminal);
      
      expect(terminal.id).toBe('minimal-terminal');
      expect(terminal.name).toBe('Minimal Terminal');
      expect(terminal.isAvailable).toBe(false);
      expect(terminal.type).toBeUndefined();
      expect(terminal.currentDirectory).toBeUndefined();
      expect(terminal.environment).toBeUndefined();
      expect(terminal.history).toBeUndefined();
      expect(terminal.output).toBeUndefined();
      expect(terminal.isRunning).toBeUndefined();
      expect(terminal.processId).toBeUndefined();
    });

    it('should handle empty arrays and objects', () => {
      const terminal = new Terminal({
        id: 'empty-arrays',
        name: 'Empty Arrays',
        isAvailable: true,
        history: [],
        environment: {}
      });

      expect(terminal.history).toEqual([]);
      expect(terminal.environment).toEqual({});
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null values gracefully', () => {
      const terminal = new Terminal({
        id: null as any,
        name: null as any,
        type: null as any,
        isAvailable: null as any,
        currentDirectory: null as any,
        environment: null as any,
        history: null as any,
        output: null as any,
        isRunning: null as any,
        processId: null as any
      });

      expect(terminal.id).toBeNull();
      expect(terminal.name).toBeNull();
      expect(terminal.type).toBeNull();
      expect(terminal.isAvailable).toBeNull();
      expect(terminal.currentDirectory).toBeNull();
      expect(terminal.environment).toBeNull();
      expect(terminal.history).toBeNull();
      expect(terminal.output).toBeNull();
      expect(terminal.isRunning).toBeNull();
      expect(terminal.processId).toBeNull();
    });

    it('should handle undefined values', () => {
      const terminal = new Terminal({
        id: undefined,
        name: undefined,
        type: undefined,
        isAvailable: undefined,
        currentDirectory: undefined,
        environment: undefined,
        history: undefined,
        output: undefined,
        isRunning: undefined,
        processId: undefined
      });

      expect(terminal.id).toBeUndefined();
      expect(terminal.name).toBeUndefined();
      expect(terminal.type).toBeUndefined();
      expect(terminal.isAvailable).toBeUndefined();
      expect(terminal.currentDirectory).toBeUndefined();
      expect(terminal.environment).toBeUndefined();
      expect(terminal.history).toBeUndefined();
      expect(terminal.output).toBeUndefined();
      expect(terminal.isRunning).toBeUndefined();
      expect(terminal.processId).toBeUndefined();
    });

    it('should handle wrong data types', () => {
      const terminal = new Terminal({
        id: 123 as any,
        name: [] as any,
        type: {} as any,
        isAvailable: 'not-a-boolean' as any,
        currentDirectory: true as any,
        environment: 'not-an-object' as any,
        history: 456 as any,
        output: [] as any,
        isRunning: 'not-a-boolean' as any,
        processId: 'not-a-number' as any
      });

      expect(terminal.id).toBe(123);
      expect(terminal.name).toEqual([]);
      expect(terminal.type).toEqual({});
      expect(terminal.isAvailable).toBe('not-a-boolean');
      expect(terminal.currentDirectory).toBe(true);
      expect(terminal.environment).toBe('not-an-object');
      expect(terminal.history).toBe(456);
      expect(terminal.output).toEqual([]);
      expect(terminal.isRunning).toBe('not-a-boolean');
      expect(terminal.processId).toBe('not-a-number');
    });

    it('should handle empty object', () => {
      const terminal = new Terminal({});
      
      expect(terminal.id).toBeUndefined();
      expect(terminal.name).toBeUndefined();
      expect(terminal.isAvailable).toBeUndefined();
    });
  });

  describe('Error Input Tests', () => {
    it('should handle malformed history array', () => {
      const malformedHistory = [
        null,
        undefined,
        123,
        {},
        [],
        'string-command'
      ];

      const terminal = new Terminal({
        id: 'malformed',
        name: 'Malformed',
        isAvailable: true,
        history: malformedHistory as any
      });

      expect(terminal.history).toEqual(malformedHistory);
    });

    it('should handle malformed environment object', () => {
      const malformedEnvironment = {
        PATH: null,
        HOME: 123,
        USER: []
      };

      const terminal = new Terminal({
        id: 'malformed-env',
        name: 'Malformed Environment',
        isAvailable: true,
        environment: malformedEnvironment as any
      });

      expect(terminal.environment).toEqual(malformedEnvironment);
    });

    it('should handle circular references', () => {
      const circular: any = { id: 'circular', name: 'Circular' };
      circular.self = circular;

      const terminal = new Terminal(circular);
      
      expect(terminal.id).toBe('circular');
      expect(terminal.name).toBe('Circular');
      expect((terminal as any).self).toBe(circular);
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(1000000);
      const terminal = new Terminal({
        id: 'long-string',
        name: longString,
        currentDirectory: longString,
        output: longString
      });

      expect(terminal.name).toBe(longString);
      expect(terminal.currentDirectory).toBe(longString);
      expect(terminal.output).toBe(longString);
    });

    it('should handle large history arrays', () => {
      const largeHistory = Array.from({ length: 10000 }, (_, i) => `command-${i}`);
      const terminal = new Terminal({
        id: 'large-history',
        name: 'Large History',
        isAvailable: true,
        history: largeHistory
      });

      expect(terminal.history).toEqual(largeHistory);
    });

    it('should handle large environment objects', () => {
      const largeEnvironment = Array.from({ length: 1000 }, (_, i) => ({
        [`VAR_${i}`]: `value-${i}`
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const terminal = new Terminal({
        id: 'large-env',
        name: 'Large Environment',
        isAvailable: true,
        environment: largeEnvironment
      });

      expect(terminal.environment).toEqual(largeEnvironment);
    });

    it('should handle deeply nested objects', () => {
      const deeplyNested = (() => {
        const obj: any = {};
        let current = obj;
        for (let i = 0; i < 100; i++) {
          current.nested = {};
          current = current.nested;
        }
        return obj;
      })();

      const terminal = new Terminal({
        id: 'nested',
        name: 'Nested',
        isAvailable: true,
        extra: deeplyNested
      });

      expect((terminal as any).extra).toBe(deeplyNested);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in property names', () => {
      const terminalWithTypos = {
        id: 'typos',
        nam: 'Test Terminal', // should be 'name'
        typ: 'bash', // should be 'type'
        isAvalable: true, // should be 'isAvailable'
        currentDrectory: '/home/user', // should be 'currentDirectory'
        envronment: { PATH: '/usr/bin' }, // should be 'environment'
        hstory: ['ls -la'], // should be 'history'
        otput: 'output', // should be 'output'
        isRunnng: true, // should be 'isRunning'
        processd: 12345 // should be 'processId'
      };

      const terminal = new Terminal(terminalWithTypos as any);
      
      expect(terminal.id).toBe('typos');
      expect((terminal as any).nam).toBe('Test Terminal');
      expect((terminal as any).typ).toBe('bash');
      expect((terminal as any).isAvalable).toBe(true);
      expect((terminal as any).currentDrectory).toBe('/home/user');
      expect((terminal as any).envronment).toEqual({ PATH: '/usr/bin' });
      expect((terminal as any).hstory).toEqual(['ls -la']);
      expect((terminal as any).otput).toBe('output');
      expect((terminal as any).isRunnng).toBe(true);
      expect((terminal as any).processd).toBe(12345);
    });

    it('should handle wrong property types', () => {
      const wrongTypes = {
        id: 123,
        name: [],
        type: 456,
        isAvailable: 'true',
        currentDirectory: true,
        environment: 'not-an-object',
        history: 'single-command',
        output: 789,
        isRunning: 'false',
        processId: 'not-a-number'
      };

      const terminal = new Terminal(wrongTypes as any);
      
      expect(terminal.id).toBe(123);
      expect(terminal.name).toEqual([]);
      expect(terminal.type).toBe(456);
      expect(terminal.isAvailable).toBe('true');
      expect(terminal.currentDirectory).toBe(true);
      expect(terminal.environment).toBe('not-an-object');
      expect(terminal.history).toBe('single-command');
      expect(terminal.output).toBe(789);
      expect(terminal.isRunning).toBe('false');
      expect(terminal.processId).toBe('not-a-number');
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal in currentDirectory', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const terminal = new Terminal({
          id: 'path-traversal',
          name: 'Path Traversal',
          isAvailable: true,
          currentDirectory: path
        });

        expect(terminal.currentDirectory).toBe(path);
      });
    });

    it('should handle null bytes in paths and output', () => {
      const nullByteString = 'file\x00name';
      const terminal = new Terminal({
        id: 'null-bytes',
        name: 'Null Bytes',
        isAvailable: true,
        currentDirectory: nullByteString,
        output: nullByteString
      });

      expect(terminal.currentDirectory).toBe(nullByteString);
      expect(terminal.output).toBe(nullByteString);
    });

    it('should handle unicode control characters', () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const terminal = new Terminal({
        id: 'unicode-control',
        name: unicodeControl,
        isAvailable: true,
        currentDirectory: unicodeControl,
        output: unicodeControl
      });

      expect(terminal.name).toBe(unicodeControl);
      expect(terminal.currentDirectory).toBe(unicodeControl);
      expect(terminal.output).toBe(unicodeControl);
    });

    it('should handle script injection attempts', () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const terminal = new Terminal({
        id: 'script-injection',
        name: scriptInjection,
        isAvailable: true,
        output: scriptInjection
      });

      expect(terminal.name).toBe(scriptInjection);
      expect(terminal.output).toBe(scriptInjection);
    });

    it('should handle command injection in history', () => {
      const maliciousCommands = [
        'rm -rf /',
        'echo "hello" && rm -rf /',
        '; DROP TABLE users;',
        '$(rm -rf /)',
        '`rm -rf /`'
      ];

      maliciousCommands.forEach(command => {
        const terminal = new Terminal({
          id: 'malicious-command',
          name: 'Malicious Command',
          isAvailable: true,
          history: [command]
        });

        expect(terminal.history).toEqual([command]);
      });
    });

    it('should handle malicious environment variables', () => {
      const maliciousEnv = {
        PATH: '$(rm -rf /)',
        HOME: '`rm -rf /`',
        USER: '; DROP TABLE users;'
      };

      const terminal = new Terminal({
        id: 'malicious-env',
        name: 'Malicious Environment',
        isAvailable: true,
        environment: maliciousEnv
      });

      expect(terminal.environment).toEqual(maliciousEnv);
    });
  });

  describe('Method Tests', () => {
    it('should have toJSON method', () => {
      const terminal = new Terminal({
        id: 'test-json',
        name: 'Test JSON',
        isAvailable: true,
        type: 'bash',
        currentDirectory: '/home/user',
        history: ['ls -la', 'git status']
      });

      const json = terminal.toJSON();
      
      expect(json).toEqual({
        id: 'test-json',
        name: 'Test JSON',
        isAvailable: true,
        type: 'bash',
        currentDirectory: '/home/user',
        history: ['ls -la', 'git status']
      });
    });

    it('should have validate method', () => {
      const terminal = new Terminal({
        id: 'test-validate',
        name: 'Test Validate',
        isAvailable: true
      });

      expect(typeof terminal.validate).toBe('function');
    });

    it('should have clone method', () => {
      const terminal = new Terminal({
        id: 'test-clone',
        name: 'Test Clone',
        isAvailable: true,
        type: 'bash',
        currentDirectory: '/home/user',
        history: ['ls -la']
      });

      const cloned = terminal.clone();
      
      expect(cloned).not.toBe(terminal);
      expect(cloned.id).toBe(terminal.id);
      expect(cloned.name).toBe(terminal.name);
      expect(cloned.isAvailable).toBe(terminal.isAvailable);
      expect(cloned.type).toBe(terminal.type);
      expect(cloned.currentDirectory).toBe(terminal.currentDirectory);
      expect(cloned.history).toEqual(terminal.history);
    });

    it('should have execute method', () => {
      const terminal = new Terminal({
        id: 'test-execute',
        name: 'Test Execute',
        isAvailable: true
      });

      expect(typeof terminal.execute).toBe('function');
    });

    it('should have executeSync method', () => {
      const terminal = new Terminal({
        id: 'test-execute-sync',
        name: 'Test Execute Sync',
        isAvailable: true
      });

      expect(typeof terminal.executeSync).toBe('function');
    });

    it('should have addToHistory method', () => {
      const terminal = new Terminal({
        id: 'test-add-history',
        name: 'Test Add History',
        isAvailable: true,
        history: ['ls -la']
      });

      expect(typeof terminal.addToHistory).toBe('function');
    });

    it('should have clearHistory method', () => {
      const terminal = new Terminal({
        id: 'test-clear-history',
        name: 'Test Clear History',
        isAvailable: true,
        history: ['ls -la', 'git status']
      });

      expect(typeof terminal.clearHistory).toBe('function');
    });

    it('should have updateEnvironment method', () => {
      const terminal = new Terminal({
        id: 'test-update-env',
        name: 'Test Update Environment',
        isAvailable: true,
        environment: {
          PATH: '/usr/bin',
          HOME: '/home/user'
        }
      });

      expect(typeof terminal.updateEnvironment).toBe('function');
    });
  });
}); 