import { IDEService } from '@codestate/core/services/ide/IDEService';
import { IIDERepository } from '@codestate/core/domain/ports/IIDERepository';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IDE, FileOpenRequest } from '@codestate/core/domain/models/IDE';
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
const mockRepository: IIDERepository = {
  getIDEDefinitions: jest.fn(),
  saveIDEDefinitions: jest.fn(),
};

// Mock terminal service
const mockTerminalService: ITerminalService = {
  execute: jest.fn(),
  executeCommand: jest.fn(),
  executeBatch: jest.fn(),
  spawnTerminal: jest.fn(),
  spawnTerminalCommand: jest.fn(),
  isCommandAvailable: jest.fn(),
  getShell: jest.fn(),
};

describe('IDEService', () => {
  let ideService: IDEService;
  let mockRepo: jest.Mocked<IIDERepository>;
  let mockTerminal: jest.Mocked<ITerminalService>;
  let mockLog: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = mockRepository as jest.Mocked<IIDERepository>;
    mockTerminal = mockTerminalService as jest.Mocked<ITerminalService>;
    mockLog = mockLogger as jest.Mocked<ILoggerService>;
    ideService = new IDEService(mockRepo, mockTerminal, mockLog);
  });

  describe('openIDE', () => {
    const mockIDE: IDE = {
      name: 'vscode',
      command: 'code',
      args: ['--new-window'],
      supportedPlatforms: ['win32', 'darwin', 'linux']
    };

    it('should open IDE successfully', async () => {
      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [mockIDE] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });
      mockTerminal.spawnTerminal.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.openIDE('vscode', '/test/project');

      expect(result.ok).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(true);
      }
      expect(mockLog.debug).toHaveBeenCalledWith('IDEService.openIDE called', { ideName: 'vscode', projectRoot: '/test/project' });
      expect(mockLog.log).toHaveBeenCalledWith('IDE opened successfully', { ideName: 'vscode', projectRoot: '/test/project' });
    });

    it('should handle IDE not installed', async () => {
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: false });

      const result = await ideService.openIDE('vscode', '/test/project');

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe("IDE 'vscode' is not installed");
      }
      expect(mockLog.error).toHaveBeenCalledWith('IDE is not installed', { ideName: 'vscode' });
    });

    it('should handle IDE definition not found', async () => {
      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.openIDE('nonexistent', '/test/project');

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe("IDE definition for 'nonexistent' not found");
      }
      expect(mockLog.error).toHaveBeenCalledWith('IDE definition not found', { ideName: 'nonexistent' });
    });

    it('should handle platform incompatibility', async () => {
      const unsupportedIDE: IDE = {
        name: 'mac-only-ide',
        command: 'macide',
        args: [],
        supportedPlatforms: ['darwin'] // Only macOS
      };

      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [unsupportedIDE] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.openIDE('mac-only-ide', '/test/project');

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toContain('is not supported on');
      }
      expect(mockLog.error).toHaveBeenCalledWith('IDE not supported on current platform', expect.any(Object));
    });

    it('should handle terminal spawn failure', async () => {
      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [mockIDE] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });
      mockTerminal.spawnTerminal.mockResolvedValue({ ok: false, error: new Error('Spawn failed') });

      const result = await ideService.openIDE('vscode', '/test/project');

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe('Spawn failed');
      }
      expect(mockLog.error).toHaveBeenCalledWith('Failed to open IDE', expect.any(Object));
    });
  });

  describe('openFiles', () => {
    const mockIDE: IDE = {
      name: 'vscode',
      command: 'code',
      args: ['--new-window'],
      supportedPlatforms: ['win32', 'darwin', 'linux']
    };

    const mockFileRequest: FileOpenRequest = {
      ide: 'vscode',
      projectRoot: '/test/project',
      files: [
        { path: '/test/file1.ts', line: 10, column: 5 },
        { path: '/test/file2.ts', line: 20 }
      ]
    };

    it('should open files successfully', async () => {
      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [mockIDE] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });
      mockTerminal.spawnTerminal.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.openFiles(mockFileRequest);

      expect(result.ok).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(true);
      }
      expect(mockLog.debug).toHaveBeenCalledWith('IDEService.openFiles called', { request: mockFileRequest });
      expect(mockLog.log).toHaveBeenCalledWith('Files opened successfully', { ide: 'vscode', fileCount: 2 });
    });

    it('should handle IDE not installed for file opening', async () => {
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: false });

      const result = await ideService.openFiles(mockFileRequest);

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe("IDE 'vscode' is not installed");
      }
      expect(mockLog.error).toHaveBeenCalledWith('IDE is not installed', { ide: 'vscode' });
    });

    it('should handle empty file list', async () => {
      const emptyRequest: FileOpenRequest = {
        ide: 'vscode',
        projectRoot: '/test/project',
        files: []
      };

      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: [mockIDE] });
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.openFiles(emptyRequest);

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe('No files to open');
      }
      expect(mockLog.error).toHaveBeenCalledWith('No files to open', { request: emptyRequest });
    });
  });

  describe('getAvailableIDEs', () => {
    it('should return available IDEs successfully', async () => {
      const mockIDEs: IDE[] = [
        {
          name: 'vscode',
          command: 'code',
          args: ['--new-window'],
          supportedPlatforms: ['win32', 'darwin', 'linux']
        },
        {
          name: 'webstorm',
          command: 'webstorm',
          args: [],
          supportedPlatforms: ['win32', 'darwin', 'linux']
        }
      ];

      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: true, value: mockIDEs });

      const result = await ideService.getAvailableIDEs();

      expect(result.ok).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('vscode');
        expect(result.value[1].name).toBe('webstorm');
      }
    });

    it('should handle repository error', async () => {
      mockRepo.getIDEDefinitions.mockResolvedValue({ ok: false, error: new Error('Repository error') });

      const result = await ideService.getAvailableIDEs();

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe('Repository error');
      }
    });
  });

  describe('isIDEInstalled', () => {
    it('should return true for installed IDE', async () => {
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: true });

      const result = await ideService.isIDEInstalled('vscode');

      expect(result.ok).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false for not installed IDE', async () => {
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: true, value: false });

      const result = await ideService.isIDEInstalled('nonexistent');

      expect(result.ok).toBe(true);
      if (isSuccess(result)) {
        expect(result.value).toBe(false);
      }
    });

    it('should handle terminal service error', async () => {
      mockTerminal.isCommandAvailable.mockResolvedValue({ ok: false, error: new Error('Terminal error') });

      const result = await ideService.isIDEInstalled('vscode');

      expect(result.ok).toBe(false);
      if (isFailure(result)) {
        expect(result.error.message).toBe('Terminal error');
      }
    });
  });
}); 