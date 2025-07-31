import { TerminalService } from '@codestate/infrastructure/services/Terminal/TerminalService';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

// Mock dependencies
const mockLoggerService: jest.Mocked<ILoggerService> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock child_process
const mockExec = jest.fn();
const mockExecSync = jest.fn();

jest.mock('child_process', () => ({
  exec: mockExec,
  execSync: mockExecSync
}));

describe('TerminalService', () => {
  let terminalService: TerminalService;

  beforeEach(() => {
    jest.clearAllMocks();
    terminalService = new TerminalService(mockLoggerService);
  });

  describe('Happy Path Tests', () => {
    it('should execute command successfully', async () => {
      const command = 'echo "hello world"';
      const expectedOutput = 'hello world\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
      expect(result.error).toBeNull();
      expect(mockExec).toHaveBeenCalledWith(command, expect.any(Function));
    });

    it('should execute command with error output', async () => {
      const command = 'ls /nonexistent';
      const expectedError = 'ls: /nonexistent: No such file or directory';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe('');
      expect(result.error).toBe(expectedError);
    });

    it('should execute command synchronously successfully', () => {
      const command = 'echo "hello world"';
      const expectedOutput = 'hello world\n';

      mockExecSync.mockReturnValue(Buffer.from(expectedOutput));

      const result = terminalService.executeSync(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
      expect(result.error).toBeNull();
      expect(mockExecSync).toHaveBeenCalledWith(command, expect.any(Object));
    });

    it('should execute command synchronously with error', () => {
      const command = 'ls /nonexistent';
      const expectedError = 'ls: /nonexistent: No such file or directory';

      mockExecSync.mockImplementation(() => {
        const error = new Error(expectedError);
        (error as any).stderr = Buffer.from(expectedError);
        throw error;
      });

      const result = terminalService.executeSync(command);

      expect(result.success).toBe(false);
      expect(result.output).toBe('');
      expect(result.error).toBe(expectedError);
    });

    it('should check if terminal is available', () => {
      const result = terminalService.isAvailable();

      expect(result).toBe(true);
    });

    it('should handle commands with spaces and special characters', async () => {
      const command = 'echo "hello world with spaces" && echo "second command"';
      const expectedOutput = 'hello world with spaces\nsecond command\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
    });

    it('should handle long commands', async () => {
      const longCommand = 'echo "' + 'a'.repeat(10000) + '"';
      const expectedOutput = 'a'.repeat(10000) + '\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(longCommand);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
    });

    it('should handle commands with newlines', async () => {
      const command = 'echo "line1\necho line2"';
      const expectedOutput = 'line1\necho line2\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null command', async () => {
      const result = await terminalService.execute(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle undefined command', async () => {
      const result = await terminalService.execute(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle empty command', async () => {
      const result = await terminalService.execute('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle whitespace-only command', async () => {
      const result = await terminalService.execute('   \n\t  ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle null command for sync execution', () => {
      const result = terminalService.executeSync(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle undefined command for sync execution', () => {
      const result = terminalService.executeSync(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });

    it('should handle empty command for sync execution', () => {
      const result = terminalService.executeSync('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle command execution errors', async () => {
      const command = 'nonexistent-command';
      const expectedError = 'nonexistent-command: command not found';

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(expectedError), '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(expectedError);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle permission denied errors', async () => {
      const command = 'sudo rm -rf /';
      const expectedError = 'Permission denied';

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(expectedError), '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(expectedError);
    });

    it('should handle timeout errors', async () => {
      const command = 'sleep 100';
      const expectedError = 'ETIMEDOUT';

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(expectedError), '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(expectedError);
    });

    it('should handle network errors', async () => {
      const command = 'curl https://nonexistent-domain.com';
      const expectedError = 'ENOTFOUND';

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(expectedError), '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(expectedError);
    });

    it('should handle malformed command errors', async () => {
      const command = 'echo "unclosed quote';
      const expectedError = 'syntax error';

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(expectedError), '', expectedError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(expectedError);
    });

    it('should handle circular references in command', async () => {
      const circular: any = { command: 'echo "test"' };
      circular.self = circular;

      const result = await terminalService.execute(circular);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long commands', async () => {
      const longCommand = 'echo "' + 'a'.repeat(1000000) + '"';
      const expectedOutput = 'a'.repeat(1000000) + '\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(longCommand);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
    });

    it('should handle commands with large output', async () => {
      const command = 'echo "large output"';
      const largeOutput = 'a'.repeat(1000000) + '\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, largeOutput, '');
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(largeOutput);
    });

    it('should handle commands with large error output', async () => {
      const command = 'nonexistent-command';
      const largeError = 'a'.repeat(1000000);

      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error(largeError), '', largeError);
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(false);
      expect(result.error).toBe(largeError);
    });

    it('should handle deeply nested command structures', async () => {
      const deeplyNested = (() => {
        let command = 'echo "test"';
        for (let i = 0; i < 1000; i++) {
          command = `(${command})`;
        }
        return command;
      })();

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'test\n', '');
      });

      const result = await terminalService.execute(deeplyNested);

      expect(result.success).toBe(true);
      expect(result.output).toBe('test\n');
    });

    it('should handle commands with unicode characters', async () => {
      const command = 'echo "测试中文 🚀 emoji"';
      const expectedOutput = '测试中文 🚀 emoji\n';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, expectedOutput, '');
      });

      const result = await terminalService.execute(command);

      expect(result.success).toBe(true);
      expect(result.output).toBe(expectedOutput);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in commands', async () => {
      const typos = [
        'ech "hello"', // should be 'echo'
        'l -la', // should be 'ls -la'
        'cd /nonexistent && ls', // should be 'cd /nonexistent && ls'
        'git sttus', // should be 'git status'
        'npm instll', // should be 'npm install'
      ];

      typos.forEach(typo => {
        mockExec.mockImplementation((cmd, callback) => {
          callback(new Error(`command not found: ${typo.split(' ')[0]}`), '', 'command not found');
        });

        const result = terminalService.execute(typo);

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.stringContaining('command not found')
        });
      });
    });

    it('should handle wrong parameter types', async () => {
      const wrongTypes = [
        123,
        [],
        {},
        true,
        null,
        undefined
      ];

      wrongTypes.forEach(type => {
        const result = terminalService.execute(type as any);

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.stringContaining('Invalid command')
        });
      });
    });

    it('should handle missing command arguments', async () => {
      const incompleteCommands = [
        'echo',
        'ls',
        'cd',
        'git',
        'npm'
      ];

      incompleteCommands.forEach(cmd => {
        mockExec.mockImplementation((command, callback) => {
          callback(null, '', '');
        });

        const result = terminalService.execute(cmd);

        expect(result).resolves.toMatchObject({
          success: true
        });
      });
    });

    it('should handle case sensitivity in commands', async () => {
      const caseVariations = [
        'ECHO "hello"',
        'Echo "hello"',
        'echo "hello"',
        'LS -LA',
        'ls -la'
      ];

      caseVariations.forEach(cmd => {
        mockExec.mockImplementation((command, callback) => {
          callback(null, 'hello\n', '');
        });

        const result = terminalService.execute(cmd);

        expect(result).resolves.toMatchObject({
          success: true
        });
      });
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle command injection attempts', async () => {
      const maliciousCommands = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; rm -rf /',
        '&& rm -rf /',
        '| rm -rf /',
        'echo "test" && rm -rf /',
        'echo "test" ; rm -rf /',
        'echo "test" | rm -rf /'
      ];

      maliciousCommands.forEach(command => {
        mockExec.mockImplementation((cmd, callback) => {
          callback(null, 'test\n', '');
        });

        const result = terminalService.execute(command);

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockExec).toHaveBeenCalledWith(command, expect.any(Function));
      });
    });

    it('should handle path traversal attempts', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const command = `cat ${path}`;
        mockExec.mockImplementation((cmd, callback) => {
          callback(null, 'content\n', '');
        });

        const result = terminalService.execute(command);

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockExec).toHaveBeenCalledWith(command, expect.any(Function));
      });
    });

    it('should handle null bytes in commands', async () => {
      const nullByteCommand = 'echo "test\x00malicious"';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'test\x00malicious\n', '');
      });

      const result = await terminalService.execute(nullByteCommand);

      expect(result.success).toBe(true);
      expect(result.output).toBe('test\x00malicious\n');
    });

    it('should handle unicode control characters', async () => {
      const unicodeControlCommand = 'echo "\u0000\u0001\u0002\u0003test"';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, '\u0000\u0001\u0002\u0003test\n', '');
      });

      const result = await terminalService.execute(unicodeControlCommand);

      expect(result.success).toBe(true);
      expect(result.output).toBe('\u0000\u0001\u0002\u0003test\n');
    });

    it('should handle script injection attempts', async () => {
      const scriptInjection = '<script>alert("xss")</script>';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, scriptInjection + '\n', '');
      });

      const result = await terminalService.execute(`echo "${scriptInjection}"`);

      expect(result.success).toBe(true);
      expect(result.output).toBe(scriptInjection + '\n');
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjection = '; DROP TABLE users; --';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, sqlInjection + '\n', '');
      });

      const result = await terminalService.execute(`echo "${sqlInjection}"`);

      expect(result.success).toBe(true);
      expect(result.output).toBe(sqlInjection + '\n');
    });

    it('should handle environment variable injection', async () => {
      const envInjection = '$(rm -rf /)';

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, envInjection + '\n', '');
      });

      const result = await terminalService.execute(`echo "${envInjection}"`);

      expect(result.success).toBe(true);
      expect(result.output).toBe(envInjection + '\n');
    });
  });

  describe('Method Tests', () => {
    it('should have execute method', () => {
      expect(typeof terminalService.execute).toBe('function');
    });

    it('should have executeSync method', () => {
      expect(typeof terminalService.executeSync).toBe('function');
    });

    it('should have isAvailable method', () => {
      expect(typeof terminalService.isAvailable).toBe('function');
    });

    it('should have validateCommand method', () => {
      expect(typeof (terminalService as any).validateCommand).toBe('function');
    });

    it('should have sanitizeCommand method', () => {
      expect(typeof (terminalService as any).sanitizeCommand).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full command workflow', async () => {
      // Execute simple command
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'hello world\n', '');
      });

      const executeResult = await terminalService.execute('echo "hello world"');
      expect(executeResult.success).toBe(true);

      // Execute command with error
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('command not found'), '', 'command not found');
      });

      const errorResult = await terminalService.execute('nonexistent-command');
      expect(errorResult.success).toBe(false);

      // Execute sync command
      mockExecSync.mockReturnValue(Buffer.from('sync output\n'));

      const syncResult = terminalService.executeSync('echo "sync output"');
      expect(syncResult.success).toBe(true);

      // Check availability
      const availableResult = terminalService.isAvailable();
      expect(availableResult).toBe(true);
    });

    it('should handle different command types', async () => {
      const commandTypes = [
        'echo "simple string"',
        'ls -la',
        'git status',
        'npm install',
        'docker ps',
        'kubectl get pods'
      ];

      commandTypes.forEach(command => {
        mockExec.mockImplementation((cmd, callback) => {
          callback(null, 'output\n', '');
        });

        const result = terminalService.execute(command);

        expect(result).resolves.toMatchObject({
          success: true
        });
      });
    });

    it('should handle multiple concurrent executions', async () => {
      const commands = [
        'echo "command1"',
        'echo "command2"',
        'echo "command3"'
      ];

      mockExec.mockImplementation((cmd, callback) => {
        callback(null, cmd + ' output\n', '');
      });

      const results = await Promise.all(
        commands.map(cmd => terminalService.execute(cmd))
      );

      expect(results).toHaveLength(3);
      expect(results.every(result => result.success)).toBe(true);
    });
  });
}); 