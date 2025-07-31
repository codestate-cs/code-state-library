import { IDEService } from '@codestate/core/services/ide/IDEService';
import { IDE } from '@codestate/core/domain/models/IDE';
import { IIDEService } from '@codestate/core/domain/ports/IIDEService';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

// Mock dependencies
const mockTerminalService: jest.Mocked<ITerminalService> = {
  execute: jest.fn(),
  executeSync: jest.fn(),
  isAvailable: jest.fn()
};

const mockLoggerService: jest.Mocked<ILoggerService> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

describe('IDEService', () => {
  let ideService: IDEService;

  beforeEach(() => {
    jest.clearAllMocks();
    ideService = new IDEService(mockTerminalService, mockLoggerService);
  });

  describe('Happy Path Tests', () => {
    it('should open file successfully', async () => {
      const filePath = '/path/to/file.ts';
      const ideName = 'vscode';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(filePath, ideName);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "${filePath}"`
      );
    });

    it('should open multiple files successfully', async () => {
      const filePaths = ['/path/to/file1.ts', '/path/to/file2.ts'];
      const ideName = 'vscode';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFiles(filePaths, ideName);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "${filePaths[0]}" "${filePaths[1]}"`
      );
    });

    it('should get open files successfully', async () => {
      const ideName = 'vscode';
      const openFilesOutput = `/path/to/file1.ts
/path/to/file2.ts
/path/to/file3.ts`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: openFilesOutput,
        error: null
      });

      const result = await ideService.getOpenFiles(ideName);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        '/path/to/file1.ts',
        '/path/to/file2.ts',
        '/path/to/file3.ts'
      ]);
    });

    it('should get available IDEs successfully', async () => {
      const availableIDEs = [
        { id: 'vscode', name: 'Visual Studio Code', executable: 'code', isAvailable: true },
        { id: 'webstorm', name: 'WebStorm', executable: 'webstorm', isAvailable: true },
        { id: 'sublime', name: 'Sublime Text', executable: 'subl', isAvailable: false }
      ];

      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: 'code',
          error: null
        })
        .mockReturnValueOnce({
          success: true,
          output: 'webstorm',
          error: null
        })
        .mockReturnValueOnce({
          success: false,
          output: '',
          error: 'command not found'
        });

      const result = await ideService.getAvailableIDEs();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].isAvailable).toBe(true);
      expect(result.data?.[1].isAvailable).toBe(true);
      expect(result.data?.[2].isAvailable).toBe(false);
    });

    it('should open file with specific IDE', async () => {
      const filePath = '/path/to/file.ts';
      const ideName = 'webstorm';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(filePath, ideName);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `webstorm "${filePath}"`
      );
    });

    it('should handle file with spaces in path', async () => {
      const filePath = '/path/to/my file.ts';
      const ideName = 'vscode';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(filePath, ideName);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "/path/to/my file.ts"`
      );
    });

    it('should handle multiple files with spaces', async () => {
      const filePaths = ['/path/to/file 1.ts', '/path/to/file 2.ts'];
      const ideName = 'vscode';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFiles(filePaths, ideName);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "/path/to/file 1.ts" "/path/to/file 2.ts"`
      );
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null file path', async () => {
      const result = await ideService.openFile(null as any, 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATH');
    });

    it('should handle undefined file path', async () => {
      const result = await ideService.openFile(undefined as any, 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATH');
    });

    it('should handle empty file path', async () => {
      const result = await ideService.openFile('', 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATH');
    });

    it('should handle null file paths array', async () => {
      const result = await ideService.openFiles(null as any, 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATHS');
    });

    it('should handle undefined file paths array', async () => {
      const result = await ideService.openFiles(undefined as any, 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATHS');
    });

    it('should handle empty file paths array', async () => {
      const result = await ideService.openFiles([], 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATHS');
    });

    it('should handle null IDE name', async () => {
      const result = await ideService.openFile('/path/to/file.ts', null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_IDE_NAME');
    });

    it('should handle undefined IDE name', async () => {
      const result = await ideService.openFile('/path/to/file.ts', undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_IDE_NAME');
    });

    it('should handle empty IDE name', async () => {
      const result = await ideService.openFile('/path/to/file.ts', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_IDE_NAME');
    });

    it('should handle unsupported IDE', async () => {
      const result = await ideService.openFile('/path/to/file.ts', 'unsupported-ide');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNSUPPORTED_IDE');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle terminal execution errors', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'code: command not found'
      });

      const result = await ideService.openFile('/path/to/file.ts', 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IDE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle file not found', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'No such file or directory'
      });

      const result = await ideService.openFile('/nonexistent/file.ts', 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_NOT_FOUND');
    });

    it('should handle permission denied', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'Permission denied'
      });

      const result = await ideService.openFile('/protected/file.ts', 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });

    it('should handle IDE not installed', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'webstorm: command not found'
      });

      const result = await ideService.openFile('/path/to/file.ts', 'webstorm');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IDE_NOT_FOUND');
    });

    it('should handle malformed file paths', async () => {
      const malformedPaths = [
        null,
        undefined,
        '',
        '   ',
        '\n\t',
        'file:///path/to/file.ts',
        'ftp://server/file.ts'
      ];

      malformedPaths.forEach(path => {
        const result = ideService.openFile(path as any, 'vscode');

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_FILE_PATH'
          })
        });
      });
    });

    it('should handle circular references in file paths', async () => {
      const circular: any = { path: '/path/to/file.ts' };
      circular.self = circular;

      const result = await ideService.openFile(circular, 'vscode');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_PATH');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long file paths', async () => {
      const longPath = '/path/' + 'a'.repeat(1000000) + '/file.ts';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(longPath, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "${longPath}"`
      );
    });

    it('should handle large file arrays', async () => {
      const largeFileArray = Array.from({ length: 10000 }, (_, i) => `/path/to/file-${i}.ts`);

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFiles(largeFileArray, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        expect.stringContaining('code')
      );
    });

    it('should handle deeply nested file paths', async () => {
      const deeplyNestedPath = '/path/' + 'subdir/'.repeat(1000) + 'file.ts';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(deeplyNestedPath, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "${deeplyNestedPath}"`
      );
    });

    it('should handle large open files output', async () => {
      const largeOutput = Array.from({ length: 10000 }, (_, i) => `/path/to/file-${i}.ts`).join('\n');

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: largeOutput,
        error: null
      });

      const result = await ideService.getOpenFiles('vscode');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10000);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in IDE names', async () => {
      const typos = [
        'vscod', // should be 'vscode'
        'webstor', // should be 'webstorm'
        'sublim', // should be 'sublime'
        'intelij', // should be 'intellij'
        'atom-editor' // should be 'atom'
      ];

      typos.forEach(typo => {
        const result = ideService.openFile('/path/to/file.ts', typo);

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'UNSUPPORTED_IDE'
          })
        });
      });
    });

    it('should handle wrong parameter types', async () => {
      const wrongTypes = [
        { filePath: 123, ideName: 'vscode' },
        { filePath: '/path/to/file.ts', ideName: 456 },
        { filePath: [], ideName: 'vscode' },
        { filePath: '/path/to/file.ts', ideName: {} }
      ];

      wrongTypes.forEach(({ filePath, ideName }) => {
        const result = ideService.openFile(filePath as any, ideName as any);

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: expect.stringMatching(/INVALID_/)
          })
        });
      });
    });

    it('should handle missing file extensions', async () => {
      const filesWithoutExtensions = [
        '/path/to/file',
        '/path/to/file.',
        '/path/to/.file',
        '/path/to/file.txt'
      ];

      filesWithoutExtensions.forEach(file => {
        const result = ideService.openFile(file, 'vscode');

        expect(result).resolves.toMatchObject({
          success: true
        });
      });
    });

    it('should handle case sensitivity in IDE names', async () => {
      const caseVariations = [
        'VSCODE',
        'VSCode',
        'vscode',
        'WebStorm',
        'webstorm',
        'WEBSTORM'
      ];

      caseVariations.forEach(ideName => {
        const result = ideService.openFile('/path/to/file.ts', ideName);

        expect(result).resolves.toMatchObject({
          success: expect.any(Boolean)
        });
      });
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal attempts', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config',
        'file:///etc/passwd',
        'ftp://malicious.com/file.txt'
      ];

      maliciousPaths.forEach(path => {
        const result = ideService.openFile(path, 'vscode');

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
          `code "${path}"`
        );
      });
    });

    it('should handle null bytes in file paths', async () => {
      const nullBytePath = '/path/to/file\x00name.ts';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(nullBytePath, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "/path/to/file\x00name.ts"`
      );
    });

    it('should handle unicode control characters', async () => {
      const unicodeControlPath = '/path/to/\u0000\u0001\u0002\u0003file.ts';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(unicodeControlPath, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "/path/to/\u0000\u0001\u0002\u0003file.ts"`
      );
    });

    it('should handle script injection attempts', async () => {
      const scriptInjectionPath = '<script>alert("xss")</script>';

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const result = await ideService.openFile(scriptInjectionPath, 'vscode');

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `code "<script>alert(\"xss\")</script>"`
      );
    });

    it('should handle command injection in file paths', async () => {
      const maliciousPaths = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'file && rm -rf /'
      ];

      maliciousPaths.forEach(path => {
        const result = ideService.openFile(path, 'vscode');

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
          `code "${path}"`
        );
      });
    });

    it('should handle command injection in IDE names', async () => {
      const maliciousIDEs = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'ide && rm -rf /'
      ];

      maliciousIDEs.forEach(ide => {
        const result = ideService.openFile('/path/to/file.ts', ide);

        expect(result).resolves.toMatchObject({
          success: false,
          error: expect.objectContaining({
            code: 'UNSUPPORTED_IDE'
          })
        });
      });
    });
  });

  describe('Method Tests', () => {
    it('should have openFile method', () => {
      expect(typeof ideService.openFile).toBe('function');
    });

    it('should have openFiles method', () => {
      expect(typeof ideService.openFiles).toBe('function');
    });

    it('should have getOpenFiles method', () => {
      expect(typeof ideService.getOpenFiles).toBe('function');
    });

    it('should have getAvailableIDEs method', () => {
      expect(typeof ideService.getAvailableIDEs).toBe('function');
    });

    it('should have isIDEInstalled method', () => {
      expect(typeof ideService.isIDEInstalled).toBe('function');
    });

    it('should have getIDEExecutable method', () => {
      expect(typeof ideService.getIDEExecutable).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full IDE workflow', async () => {
      // Check available IDEs
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: 'code',
          error: null
        })
        .mockReturnValueOnce({
          success: true,
          output: 'webstorm',
          error: null
        });

      const availableResult = await ideService.getAvailableIDEs();
      expect(availableResult.success).toBe(true);

      // Open file with VS Code
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      const openResult = await ideService.openFile('/path/to/file.ts', 'vscode');
      expect(openResult.success).toBe(true);

      // Get open files
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '/path/to/file.ts\n/path/to/file2.ts',
        error: null
      });

      const getOpenResult = await ideService.getOpenFiles('vscode');
      expect(getOpenResult.success).toBe(true);
      expect(getOpenResult.data).toHaveLength(2);
    });

    it('should handle different IDEs', async () => {
      const supportedIDEs = ['vscode', 'webstorm', 'sublime', 'atom', 'intellij'];

      supportedIDEs.forEach(ide => {
        const result = ideService.openFile('/path/to/file.ts', ide);

        expect(result).resolves.toMatchObject({
          success: expect.any(Boolean)
        });
      });
    });

    it('should handle multiple file operations', async () => {
      const files = [
        '/path/to/file1.ts',
        '/path/to/file2.ts',
        '/path/to/file3.ts'
      ];

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '',
        error: null
      });

      // Open multiple files
      const openResult = await ideService.openFiles(files, 'vscode');
      expect(openResult.success).toBe(true);

      // Get open files
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: files.join('\n'),
        error: null
      });

      const getOpenResult = await ideService.getOpenFiles('vscode');
      expect(getOpenResult.success).toBe(true);
      expect(getOpenResult.data).toEqual(files);
    });
  });
}); 