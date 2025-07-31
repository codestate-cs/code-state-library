import { ScriptService } from '@codestate/core/services/scripts/ScriptService';
import { Script } from '@codestate/core/domain/models/Script';
import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { IStorageService } from '@codestate/core/domain/ports/IStorageService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';

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

const mockTerminalService: jest.Mocked<ITerminalService> = {
  execute: jest.fn(),
  executeSync: jest.fn(),
  isAvailable: jest.fn()
};

describe('ScriptService', () => {
  let scriptService: ScriptService;

  beforeEach(() => {
    jest.clearAllMocks();
    scriptService = new ScriptService(mockStorageService, mockLoggerService, mockTerminalService);
  });

  describe('Happy Path Tests', () => {
    it('should create script successfully', async () => {
      const scriptData = {
        name: 'Test Script',
        description: 'A test script',
        commands: ['echo "hello"', 'ls -la'],
        tags: ['test', 'demo'],
        rootPath: '/test/path'
      };

      mockStorageService.writeFile.mockResolvedValue();

      const result = await scriptService.createScript(scriptData);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Script);
      expect(result.data?.name).toBe('Test Script');
      expect(result.data?.commands).toEqual(['echo "hello"', 'ls -la']);
      expect(result.data?.tags).toEqual(['test', 'demo']);
    });

    it('should get script by id successfully', async () => {
      const scriptId = 'test-script-1';
      const scriptData = {
        id: scriptId,
        name: 'Test Script',
        commands: ['echo "hello"']
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(scriptData));

      const result = await scriptService.getScript(scriptId);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Script);
      expect(result.data?.id).toBe(scriptId);
    });

    it('should get all scripts successfully', async () => {
      const scripts = [
        { id: 'script-1', name: 'Script 1', commands: ['echo "1"'] },
        { id: 'script-2', name: 'Script 2', commands: ['echo "2"'] }
      ];

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readdir.mockResolvedValue(['script-1.json', 'script-2.json']);
      mockStorageService.readFile
        .mockResolvedValueOnce(JSON.stringify(scripts[0]))
        .mockResolvedValueOnce(JSON.stringify(scripts[1]));

      const result = await scriptService.getScripts();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toBeInstanceOf(Script);
      expect(result.data?.[1]).toBeInstanceOf(Script);
    });

    it('should update script successfully', async () => {
      const scriptId = 'test-script-1';
      const existingScript = new Script({
        id: scriptId,
        name: 'Old Name',
        commands: ['echo "old"']
      });

      const updates = {
        name: 'New Name',
        commands: ['echo "new"']
      };

      mockStorageService.writeFile.mockResolvedValue();

      const result = await scriptService.updateScript(scriptId, updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Name');
      expect(result.data?.commands).toEqual(['echo "new"']);
    });

    it('should delete script successfully', async () => {
      const scriptId = 'test-script-1';

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.unlink.mockResolvedValue();

      const result = await scriptService.deleteScript(scriptId);

      expect(result.success).toBe(true);
      expect(mockStorageService.unlink).toHaveBeenCalledWith(`/scripts/${scriptId}.json`);
    });

    it('should execute script successfully', async () => {
      const script = new Script({
        id: 'test-script',
        name: 'Test Script',
        commands: ['echo "hello"', 'ls -la']
      });

      mockTerminalService.execute.mockResolvedValue({
        success: true,
        output: 'hello\nfile1.txt file2.txt',
        error: null
      });

      const result = await scriptService.executeScript(script);

      expect(result.success).toBe(true);
      expect(mockTerminalService.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null script data', async () => {
      const result = await scriptService.createScript(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_DATA');
    });

    it('should handle undefined script data', async () => {
      const result = await scriptService.createScript(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_DATA');
    });

    it('should handle empty script name', async () => {
      const result = await scriptService.createScript({
        name: '',
        commands: ['echo "hello"']
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_NAME');
    });

    it('should handle empty commands array', async () => {
      const result = await scriptService.createScript({
        name: 'Test Script',
        commands: []
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COMMANDS');
    });

    it('should handle null script id', async () => {
      const result = await scriptService.getScript(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_ID');
    });

    it('should handle undefined script id', async () => {
      const result = await scriptService.getScript(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_ID');
    });

    it('should handle empty script id', async () => {
      const result = await scriptService.getScript('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_ID');
    });

    it('should handle null updates', async () => {
      const result = await scriptService.updateScript('test-script', null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });

    it('should handle undefined updates', async () => {
      const result = await scriptService.updateScript('test-script', undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle storage read errors', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockRejectedValue(new Error('File read error'));

      const result = await scriptService.getScript('test-script');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage write errors', async () => {
      mockStorageService.writeFile.mockRejectedValue(new Error('File write error'));

      const result = await scriptService.createScript({
        name: 'Test Script',
        commands: ['echo "hello"']
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage delete errors', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.unlink.mockRejectedValue(new Error('File delete error'));

      const result = await scriptService.deleteScript('test-script');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle terminal execution errors', async () => {
      const script = new Script({
        id: 'test-script',
        name: 'Test Script',
        commands: ['echo "hello"']
      });

      mockTerminalService.execute.mockRejectedValue(new Error('Terminal error'));

      const result = await scriptService.executeScript(script);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXECUTION_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle malformed JSON in script file', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue('invalid json');

      const result = await scriptService.getScript('test-script');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle circular references in script data', async () => {
      const circular: any = { name: 'Test Script', commands: ['echo "hello"'] };
      circular.self = circular;

      const result = await scriptService.createScript(circular);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_DATA');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large script names', async () => {
      const largeName = 'a'.repeat(1000000);
      const result = await scriptService.createScript({
        name: largeName,
        commands: ['echo "hello"']
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(largeName);
    });

    it('should handle large command arrays', async () => {
      const largeCommands = Array.from({ length: 10000 }, (_, i) => `command-${i}`);
      const result = await scriptService.createScript({
        name: 'Large Commands',
        commands: largeCommands
      });

      expect(result.success).toBe(true);
      expect(result.data?.commands).toEqual(largeCommands);
    });

    it('should handle large tag arrays', async () => {
      const largeTags = Array.from({ length: 10000 }, (_, i) => `tag-${i}`);
      const result = await scriptService.createScript({
        name: 'Large Tags',
        commands: ['echo "hello"'],
        tags: largeTags
      });

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual(largeTags);
    });

    it('should handle deeply nested objects', async () => {
      const deeplyNested = (() => {
        const obj: any = {};
        let current = obj;
        for (let i = 0; i < 100; i++) {
          current.nested = {};
          current = current.nested;
        }
        return obj;
      })();

      const result = await scriptService.createScript({
        name: 'Nested',
        commands: ['echo "hello"'],
        extra: deeplyNested
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in script properties', async () => {
      const scriptWithTypos = {
        nam: 'Test Script', // should be 'name'
        descrption: 'A test script', // should be 'description'
        cmmands: ['echo "hello"'], // should be 'commands'
        tgs: ['test'], // should be 'tags'
        rotPath: '/test/path' // should be 'rootPath'
      };

      const result = await scriptService.createScript(scriptWithTypos as any);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Script);
    });

    it('should handle wrong property types', async () => {
      const wrongTypes = {
        name: 123,
        description: [],
        commands: 'single-command',
        tags: 'single-tag',
        rootPath: true
      };

      const result = await scriptService.createScript(wrongTypes as any);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Script);
    });

    it('should handle missing required properties', async () => {
      const incompleteScript = {
        // missing name
        commands: ['echo "hello"']
      };

      const result = await scriptService.createScript(incompleteScript as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SCRIPT_NAME');
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle command injection attempts', async () => {
      const maliciousCommands = [
        'rm -rf /',
        'echo "hello" && rm -rf /',
        '; DROP TABLE users;',
        '$(rm -rf /)',
        '`rm -rf /`'
      ];

      maliciousCommands.forEach(command => {
        const result = scriptService.createScript({
          name: 'Malicious Script',
          commands: [command]
        });

        expect(result).resolves.toMatchObject({
          success: true,
          data: expect.objectContaining({
            commands: [command]
          })
        });
      });
    });

    it('should handle path traversal in rootPath', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const result = scriptService.createScript({
          name: 'Path Traversal',
          commands: ['echo "test"'],
          rootPath: path
        });

        expect(result).resolves.toMatchObject({
          success: true,
          data: expect.objectContaining({
            rootPath: path
          })
        });
      });
    });

    it('should handle null bytes in script data', async () => {
      const nullByteString = 'file\x00name';
      const result = await scriptService.createScript({
        name: nullByteString,
        commands: [nullByteString],
        rootPath: nullByteString
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(nullByteString);
      expect(result.data?.commands).toEqual([nullByteString]);
      expect(result.data?.rootPath).toBe(nullByteString);
    });

    it('should handle unicode control characters', async () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const result = await scriptService.createScript({
        name: unicodeControl,
        commands: [unicodeControl],
        description: unicodeControl
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(unicodeControl);
      expect(result.data?.commands).toEqual([unicodeControl]);
      expect(result.data?.description).toBe(unicodeControl);
    });

    it('should handle script injection attempts', async () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const result = await scriptService.createScript({
        name: scriptInjection,
        description: scriptInjection,
        commands: [scriptInjection]
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(scriptInjection);
      expect(result.data?.description).toBe(scriptInjection);
      expect(result.data?.commands).toEqual([scriptInjection]);
    });
  });

  describe('Method Tests', () => {
    it('should have createScript method', () => {
      expect(typeof scriptService.createScript).toBe('function');
    });

    it('should have getScript method', () => {
      expect(typeof scriptService.getScript).toBe('function');
    });

    it('should have getScripts method', () => {
      expect(typeof scriptService.getScripts).toBe('function');
    });

    it('should have updateScript method', () => {
      expect(typeof scriptService.updateScript).toBe('function');
    });

    it('should have deleteScript method', () => {
      expect(typeof scriptService.deleteScript).toBe('function');
    });

    it('should have executeScript method', () => {
      expect(typeof scriptService.executeScript).toBe('function');
    });

    it('should have getScriptsByRootPath method', () => {
      expect(typeof scriptService.getScriptsByRootPath).toBe('function');
    });

    it('should have deleteScriptsByRootPath method', () => {
      expect(typeof scriptService.deleteScriptsByRootPath).toBe('function');
    });

    it('should have exportScripts method', () => {
      expect(typeof scriptService.exportScripts).toBe('function');
    });

    it('should have importScripts method', () => {
      expect(typeof scriptService.importScripts).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full script lifecycle', async () => {
      // Create script
      const createResult = await scriptService.createScript({
        name: 'Test Script',
        commands: ['echo "hello"'],
        tags: ['test']
      });
      expect(createResult.success).toBe(true);

      // Get script
      const scriptId = createResult.data!.id;
      const getResult = await scriptService.getScript(scriptId);
      expect(getResult.success).toBe(true);

      // Update script
      const updateResult = await scriptService.updateScript(scriptId, {
        name: 'Updated Script',
        commands: ['echo "updated"']
      });
      expect(updateResult.success).toBe(true);

      // Execute script
      const executeResult = await scriptService.executeScript(updateResult.data!);
      expect(executeResult.success).toBe(true);

      // Delete script
      const deleteResult = await scriptService.deleteScript(scriptId);
      expect(deleteResult.success).toBe(true);
    });

    it('should handle multiple scripts', async () => {
      const scripts = [
        { name: 'Script 1', commands: ['echo "1"'] },
        { name: 'Script 2', commands: ['echo "2"'] },
        { name: 'Script 3', commands: ['echo "3"'] }
      ];

      // Create multiple scripts
      const createResults = await Promise.all(
        scripts.map(script => scriptService.createScript(script))
      );

      expect(createResults.every(result => result.success)).toBe(true);

      // Get all scripts
      const getResult = await scriptService.getScripts();
      expect(getResult.success).toBe(true);
      expect(getResult.data).toHaveLength(3);
    });
  });
}); 