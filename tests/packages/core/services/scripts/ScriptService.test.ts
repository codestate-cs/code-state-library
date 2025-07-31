import { ScriptService } from '@codestate/core/services/scripts/ScriptService';
import { IScriptRepository } from '@codestate/core/domain/ports/IScriptService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { Script, ScriptIndex } from '@codestate/core/domain/models/Script';
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
const mockRepository: IScriptRepository = {
  createScript: jest.fn(),
  createScripts: jest.fn(),
  getScriptsByRootPath: jest.fn(),
  getAllScripts: jest.fn(),
  updateScript: jest.fn(),
  updateScripts: jest.fn(),
  deleteScript: jest.fn(),
  deleteScripts: jest.fn(),
  deleteScriptsByRootPath: jest.fn(),
  loadScriptIndex: jest.fn(),
  saveScriptIndex: jest.fn(),
};

describe('ScriptService', () => {
  let scriptService: ScriptService;
  let mockRepo: jest.Mocked<IScriptRepository>;
  let mockLog: jest.Mocked<ILoggerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = mockRepository as jest.Mocked<IScriptRepository>;
    mockLog = mockLogger as jest.Mocked<ILoggerService>;
    scriptService = new ScriptService(mockRepo, mockLog);
  });

  describe('createScript', () => {
    const validScript: Script = {
      name: 'test-script',
      rootPath: '/test/path',
      script: 'echo "hello"'
    };

    describe('Happy Path', () => {
      it('should create script successfully', async () => {
        mockRepo.createScript.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.createScript(validScript);

        expect(result.ok).toBe(true);
        expect(mockRepo.createScript).toHaveBeenCalledWith(validScript);
        expect(mockLog.debug).toHaveBeenCalledWith('ScriptService.createScript called', { script: validScript });
        expect(mockLog.log).toHaveBeenCalledWith('Script created successfully', { script: validScript });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.createScript.mockResolvedValue({ ok: false, error });

        const result = await scriptService.createScript(validScript);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to create script', { error, script: validScript });
      });

      it('should handle repository throwing exception', async () => {
        const error = new Error('Unexpected error');
        mockRepo.createScript.mockRejectedValue(error);

        await expect(scriptService.createScript(validScript)).rejects.toThrow('Unexpected error');
      });
    });

    describe('Invalid Input', () => {
      it('should handle script with invalid name', async () => {
        const invalidScript: Script = {
          name: '',
          rootPath: '/test/path',
          script: 'echo "hello"'
        };
        mockRepo.createScript.mockResolvedValue({ ok: false, error: new Error('Invalid name') });

        const result = await scriptService.createScript(invalidScript);
        expect(result.ok).toBe(false);
      });
    });

    describe('Malicious Input', () => {
      it('should handle script with path traversal', async () => {
        const maliciousScript: Script = {
          name: 'test',
          rootPath: '../../../etc/passwd',
          script: 'cat /etc/passwd'
        };
        mockRepo.createScript.mockResolvedValue({ ok: false, error: new Error('Path traversal detected') });

        const result = await scriptService.createScript(maliciousScript);
        expect(result.ok).toBe(false);
      });

      it('should handle script with command injection', async () => {
        const maliciousScript: Script = {
          name: 'test',
          rootPath: '/test/path',
          script: 'rm -rf /; echo "hacked"'
        };
        mockRepo.createScript.mockResolvedValue({ ok: false, error: new Error('Command injection detected') });

        const result = await scriptService.createScript(maliciousScript);
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('createScripts', () => {
    const validScripts: Script[] = [
      {
        name: 'script1',
        rootPath: '/test/path1',
        script: 'echo "hello1"'
      },
      {
        name: 'script2',
        rootPath: '/test/path2',
        script: 'echo "hello2"'
      },
    ];

    describe('Happy Path', () => {
      it('should create multiple scripts successfully', async () => {
        mockRepo.createScripts.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.createScripts(validScripts);

        expect(result.ok).toBe(true);
        expect(mockRepo.createScripts).toHaveBeenCalledWith(validScripts);
        expect(mockLog.debug).toHaveBeenCalledWith('ScriptService.createScripts called', { count: 2 });
        expect(mockLog.log).toHaveBeenCalledWith('Scripts created successfully', { count: 2 });
      });

      it('should handle empty array', async () => {
        mockRepo.createScripts.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.createScripts([]);

        expect(result.ok).toBe(true);
        expect(mockLog.debug).toHaveBeenCalledWith('ScriptService.createScripts called', { count: 0 });
      });
    });

    describe('Error Cases', () => {
      it('should handle partial failure', async () => {
        const error = new Error('Partial failure');
        mockRepo.createScripts.mockResolvedValue({ ok: false, error });

        const result = await scriptService.createScripts(validScripts);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to create scripts', { error, count: 2 });
      });
    });
  });

  describe('getScriptsByRootPath', () => {
    const rootPath = '/test/path';
    const scripts: Script[] = [
      {
        name: 'script1',
        rootPath,
        script: 'echo "hello1"'
      },
      {
        name: 'script2',
        rootPath,
        script: 'echo "hello2"'
      },
    ];

    describe('Happy Path', () => {
      it('should retrieve scripts by root path successfully', async () => {
        mockRepo.getScriptsByRootPath.mockResolvedValue({ ok: true, value: scripts });

        const result = await scriptService.getScriptsByRootPath(rootPath);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual(scripts);
        }
        expect(mockRepo.getScriptsByRootPath).toHaveBeenCalledWith(rootPath);
        expect(mockLog.log).toHaveBeenCalledWith('Scripts retrieved by root path', { rootPath, count: 2 });
      });

      it('should handle empty result', async () => {
        mockRepo.getScriptsByRootPath.mockResolvedValue({ ok: true, value: [] });

        const result = await scriptService.getScriptsByRootPath(rootPath);

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual([]);
        }
        expect(mockLog.log).toHaveBeenCalledWith('Scripts retrieved by root path', { rootPath, count: 0 });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.getScriptsByRootPath.mockResolvedValue({ ok: false, error });

        const result = await scriptService.getScriptsByRootPath(rootPath);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to get scripts by root path', { error, rootPath });
      });
    });
  });

  describe('getAllScripts', () => {
    const scripts: Script[] = [
      {
        name: 'script1',
        rootPath: '/path1',
        script: 'echo "hello1"'
      },
      {
        name: 'script2',
        rootPath: '/path2',
        script: 'echo "hello2"'
      },
    ];

    describe('Happy Path', () => {
      it('should retrieve all scripts successfully', async () => {
        mockRepo.getAllScripts.mockResolvedValue({ ok: true, value: scripts });

        const result = await scriptService.getAllScripts();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual(scripts);
        }
        expect(mockRepo.getAllScripts).toHaveBeenCalled();
        expect(mockLog.log).toHaveBeenCalledWith('All scripts retrieved', { count: 2 });
      });

      it('should handle empty result', async () => {
        mockRepo.getAllScripts.mockResolvedValue({ ok: true, value: [] });

        const result = await scriptService.getAllScripts();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toEqual([]);
        }
        expect(mockLog.log).toHaveBeenCalledWith('All scripts retrieved', { count: 0 });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.getAllScripts.mockResolvedValue({ ok: false, error });

        const result = await scriptService.getAllScripts();

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to get all scripts', { error });
      });
    });
  });

  describe('updateScript', () => {
    const name = 'test-script';
    const rootPath = '/test/path';
    const scriptUpdate: Partial<Script> = { script: 'echo "updated"' };

    describe('Happy Path', () => {
      it('should update script successfully', async () => {
        mockRepo.updateScript.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.updateScript(name, rootPath, scriptUpdate);

        expect(result.ok).toBe(true);
        expect(mockRepo.updateScript).toHaveBeenCalledWith(name, rootPath, scriptUpdate);
        expect(mockLog.log).toHaveBeenCalledWith('Script updated successfully', { name, rootPath });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.updateScript.mockResolvedValue({ ok: false, error });

        const result = await scriptService.updateScript(name, rootPath, scriptUpdate);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to update script', { error, name, rootPath });
      });
    });

    describe('Malicious Input', () => {
      it('should handle malicious script update', async () => {
        const maliciousUpdate: Partial<Script> = { script: 'rm -rf /' };
        mockRepo.updateScript.mockResolvedValue({ ok: false, error: new Error('Malicious command detected') });

        const result = await scriptService.updateScript(name, rootPath, maliciousUpdate);

        expect(result.ok).toBe(false);
      });
    });
  });

  describe('deleteScript', () => {
    const name = 'test-script';
    const rootPath = '/test/path';

    describe('Happy Path', () => {
      it('should delete script successfully', async () => {
        mockRepo.deleteScript.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.deleteScript(name, rootPath);

        expect(result.ok).toBe(true);
        expect(mockRepo.deleteScript).toHaveBeenCalledWith(name, rootPath);
        expect(mockLog.log).toHaveBeenCalledWith('Script deleted successfully', { name, rootPath });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.deleteScript.mockResolvedValue({ ok: false, error });

        const result = await scriptService.deleteScript(name, rootPath);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to delete script', { error, name, rootPath });
      });
    });
  });

  describe('getScriptIndex', () => {
    const scriptIndex: ScriptIndex = {
      entries: []
    };

    describe('Happy Path', () => {
      it('should retrieve script index successfully', async () => {
        mockRepo.loadScriptIndex.mockResolvedValue({ ok: true, value: scriptIndex });

        const result = await scriptService.getScriptIndex();

        expect(result.ok).toBe(true);
        if (isSuccess(result)) {
          expect(result.value).toBe(scriptIndex);
        }
        expect(mockRepo.loadScriptIndex).toHaveBeenCalled();
        expect(mockLog.log).toHaveBeenCalledWith('Script index retrieved', { entryCount: 0 });
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.loadScriptIndex.mockResolvedValue({ ok: false, error });

        const result = await scriptService.getScriptIndex();

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to get script index', { error });
      });
    });
  });

  describe('updateScriptIndex', () => {
    const scriptIndex: ScriptIndex = {
      entries: []
    };

    describe('Happy Path', () => {
      it('should update script index successfully', async () => {
        mockRepo.saveScriptIndex.mockResolvedValue({ ok: true, value: undefined });

        const result = await scriptService.updateScriptIndex(scriptIndex);

        expect(result.ok).toBe(true);
        expect(mockRepo.saveScriptIndex).toHaveBeenCalledWith(scriptIndex);
        expect(mockLog.log).toHaveBeenCalledWith('Script index updated successfully');
      });
    });

    describe('Error Cases', () => {
      it('should handle repository error', async () => {
        const error = new Error('Repository error');
        mockRepo.saveScriptIndex.mockResolvedValue({ ok: false, error });

        const result = await scriptService.updateScriptIndex(scriptIndex);

        expect(result.ok).toBe(false);
        if (isFailure(result)) {
          expect(result.error).toBe(error);
        }
        expect(mockLog.error).toHaveBeenCalledWith('Failed to update script index', { error });
      });
    });
  });
}); 