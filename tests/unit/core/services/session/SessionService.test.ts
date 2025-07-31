import { SessionService } from '@codestate/core/services/session/SessionService';
import { Session } from '@codestate/core/domain/models/Session';
import { ISessionService } from '@codestate/core/domain/ports/ISessionService';
import { IStorageService } from '@codestate/core/domain/ports/IStorageService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { IIDEService } from '@codestate/core/domain/ports/IIDEService';

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

const mockGitService: jest.Mocked<IGitService> = {
  getStatus: jest.fn(),
  getCurrentBranch: jest.fn(),
  getDirtyFiles: jest.fn(),
  commit: jest.fn(),
  stash: jest.fn(),
  applyStash: jest.fn(),
  listStashes: jest.fn(),
  deleteStash: jest.fn()
};

const mockIDEService: jest.Mocked<IIDEService> = {
  openFile: jest.fn(),
  openFiles: jest.fn(),
  getOpenFiles: jest.fn(),
  getAvailableIDEs: jest.fn()
};

describe('SessionService', () => {
  let sessionService: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionService = new SessionService(
      mockStorageService,
      mockLoggerService,
      mockGitService,
      mockIDEService
    );
  });

  describe('Happy Path Tests', () => {
    it('should save session successfully', async () => {
      const session = new Session({
        id: 'test-session-1',
        name: 'Test Session',
        description: 'A test session',
        openFiles: ['/file1.ts', '/file2.ts'],
        activeFile: '/file1.ts',
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(mockStorageService.writeFile).toHaveBeenCalledWith(
        `/sessions/${session.id}.json`,
        JSON.stringify(session.toJSON(), null, 2)
      );
    });

    it('should load session successfully', async () => {
      const sessionId = 'test-session-1';
      const sessionData = {
        id: sessionId,
        name: 'Test Session',
        openFiles: ['/file1.ts', '/file2.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(sessionData));

      const result = await sessionService.loadSession(sessionId);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Session);
      expect(result.data?.id).toBe(sessionId);
    });

    it('should list all sessions successfully', async () => {
      const sessions = [
        { id: 'session-1', name: 'Session 1', openFiles: ['/file1.ts'] },
        { id: 'session-2', name: 'Session 2', openFiles: ['/file2.ts'] }
      ];

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readdir.mockResolvedValue(['session-1.json', 'session-2.json']);
      mockStorageService.readFile
        .mockResolvedValueOnce(JSON.stringify(sessions[0]))
        .mockResolvedValueOnce(JSON.stringify(sessions[1]));

      const result = await sessionService.listSessions();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toBeInstanceOf(Session);
      expect(result.data?.[1]).toBeInstanceOf(Session);
    });

    it('should update session successfully', async () => {
      const sessionId = 'test-session-1';
      const existingSession = new Session({
        id: sessionId,
        name: 'Old Name',
        openFiles: ['/file1.ts']
      });

      const updates = {
        name: 'New Name',
        openFiles: ['/file1.ts', '/file2.ts']
      };

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.updateSession(sessionId, updates);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('New Name');
      expect(result.data?.openFiles).toEqual(['/file1.ts', '/file2.ts']);
    });

    it('should delete session successfully', async () => {
      const sessionId = 'test-session-1';

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.unlink.mockResolvedValue();

      const result = await sessionService.deleteSession(sessionId);

      expect(result.success).toBe(true);
      expect(mockStorageService.unlink).toHaveBeenCalledWith(`/sessions/${sessionId}.json`);
    });

    it('should resume session successfully', async () => {
      const session = new Session({
        id: 'test-session',
        name: 'Test Session',
        openFiles: ['/file1.ts', '/file2.ts'],
        activeFile: '/file1.ts',
        gitStatus: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      mockIDEService.openFiles.mockResolvedValue({
        success: true,
        data: ['/file1.ts', '/file2.ts']
      });

      const result = await sessionService.resumeSession(session);

      expect(result.success).toBe(true);
      expect(mockIDEService.openFiles).toHaveBeenCalledWith(['/file1.ts', '/file2.ts']);
    });

    it('should create session from current state successfully', async () => {
      const sessionName = 'Current Session';
      const openFiles = ['/file1.ts', '/file2.ts'];
      const gitStatus = {
        branch: 'main',
        isDirty: false,
        dirtyFiles: []
      };

      mockIDEService.getOpenFiles.mockResolvedValue({
        success: true,
        data: openFiles
      });

      mockGitService.getStatus.mockResolvedValue({
        success: true,
        data: gitStatus
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.createSessionFromCurrentState(sessionName);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Session);
      expect(result.data?.name).toBe(sessionName);
      expect(result.data?.openFiles).toEqual(openFiles);
      expect(result.data?.gitStatus).toEqual(gitStatus);
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null session', async () => {
      const result = await sessionService.saveSession(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION');
    });

    it('should handle undefined session', async () => {
      const result = await sessionService.saveSession(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION');
    });

    it('should handle null session id', async () => {
      const result = await sessionService.loadSession(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_ID');
    });

    it('should handle undefined session id', async () => {
      const result = await sessionService.loadSession(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_ID');
    });

    it('should handle empty session id', async () => {
      const result = await sessionService.loadSession('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_ID');
    });

    it('should handle null session name', async () => {
      const result = await sessionService.createSessionFromCurrentState(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_NAME');
    });

    it('should handle undefined session name', async () => {
      const result = await sessionService.createSessionFromCurrentState(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_NAME');
    });

    it('should handle empty session name', async () => {
      const result = await sessionService.createSessionFromCurrentState('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION_NAME');
    });

    it('should handle null updates', async () => {
      const result = await sessionService.updateSession('test-session', null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });

    it('should handle undefined updates', async () => {
      const result = await sessionService.updateSession('test-session', undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_UPDATES');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle storage read errors', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockRejectedValue(new Error('File read error'));

      const result = await sessionService.loadSession('test-session');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage write errors', async () => {
      const session = new Session({
        id: 'test-session',
        name: 'Test Session',
        openFiles: ['/file1.ts']
      });

      mockStorageService.writeFile.mockRejectedValue(new Error('File write error'));

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle storage delete errors', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.unlink.mockRejectedValue(new Error('File delete error'));

      const result = await sessionService.deleteSession('test-session');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('STORAGE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle IDE service errors', async () => {
      const session = new Session({
        id: 'test-session',
        name: 'Test Session',
        openFiles: ['/file1.ts']
      });

      mockIDEService.openFiles.mockRejectedValue(new Error('IDE error'));

      const result = await sessionService.resumeSession(session);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('IDE_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle git service errors', async () => {
      mockGitService.getStatus.mockRejectedValue(new Error('Git error'));

      const result = await sessionService.createSessionFromCurrentState('Test Session');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle malformed JSON in session file', async () => {
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue('invalid json');

      const result = await sessionService.loadSession('test-session');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle circular references in session data', async () => {
      const circular: any = { id: 'test-session', name: 'Test Session', openFiles: ['/file1.ts'] };
      circular.self = circular;

      const result = await sessionService.saveSession(circular);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_SESSION');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely large session names', async () => {
      const largeName = 'a'.repeat(1000000);
      const session = new Session({
        id: 'test-session',
        name: largeName,
        openFiles: ['/file1.ts']
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(largeName);
    });

    it('should handle large openFiles arrays', async () => {
      const largeFiles = Array.from({ length: 10000 }, (_, i) => `/file-${i}.ts`);
      const session = new Session({
        id: 'test-session',
        name: 'Large Files',
        openFiles: largeFiles
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.openFiles).toEqual(largeFiles);
    });

    it('should handle large dirtyFiles arrays', async () => {
      const largeDirtyFiles = Array.from({ length: 10000 }, (_, i) => `/dirty-${i}.ts`);
      const session = new Session({
        id: 'test-session',
        name: 'Large Dirty',
        openFiles: ['/file1.ts'],
        gitStatus: {
          branch: 'main',
          isDirty: true,
          dirtyFiles: largeDirtyFiles
        }
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.gitStatus?.dirtyFiles).toEqual(largeDirtyFiles);
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

      const session = new Session({
        id: 'test-session',
        name: 'Nested',
        openFiles: ['/file1.ts'],
        extra: deeplyNested
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in session properties', async () => {
      const sessionWithTypos = {
        id: 'test-session',
        nam: 'Test Session', // should be 'name'
        descrption: 'A test session', // should be 'description'
        openFles: ['/file1.ts'], // should be 'openFiles'
        actveFile: '/file1.ts', // should be 'activeFile'
        gitSttus: { branch: 'main' } // should be 'gitStatus'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(sessionWithTypos));

      const result = await sessionService.loadSession('test-session');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Session);
    });

    it('should handle wrong property types', async () => {
      const wrongTypes = {
        id: 123,
        name: [],
        description: 456,
        openFiles: 'single-file',
        activeFile: 789,
        gitStatus: 'not-an-object'
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(wrongTypes));

      const result = await sessionService.loadSession('test-session');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Session);
    });

    it('should handle missing required properties', async () => {
      const incompleteSession = {
        // missing id
        name: 'Test Session',
        openFiles: ['/file1.ts']
      };

      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readFile.mockResolvedValue(JSON.stringify(incompleteSession));

      const result = await sessionService.loadSession('test-session');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Session);
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle path traversal in file paths', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      maliciousPaths.forEach(path => {
        const session = new Session({
          id: 'test-session',
          name: 'Path Traversal',
          openFiles: [path],
          activeFile: path
        });

        const result = sessionService.saveSession(session);

        expect(result).resolves.toMatchObject({
          success: true,
          data: expect.objectContaining({
            openFiles: [path],
            activeFile: path
          })
        });
      });
    });

    it('should handle null bytes in file paths', async () => {
      const nullByteString = 'file\x00name.ts';
      const session = new Session({
        id: 'test-session',
        name: 'Null Bytes',
        openFiles: [nullByteString],
        activeFile: nullByteString
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.openFiles).toEqual([nullByteString]);
      expect(result.data?.activeFile).toBe(nullByteString);
    });

    it('should handle unicode control characters', async () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      const session = new Session({
        id: 'test-session',
        name: unicodeControl,
        openFiles: [unicodeControl],
        description: unicodeControl
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(unicodeControl);
      expect(result.data?.openFiles).toEqual([unicodeControl]);
      expect(result.data?.description).toBe(unicodeControl);
    });

    it('should handle script injection attempts', async () => {
      const scriptInjection = '<script>alert("xss")</script>';
      const session = new Session({
        id: 'test-session',
        name: scriptInjection,
        description: scriptInjection,
        openFiles: [scriptInjection]
      });

      mockStorageService.writeFile.mockResolvedValue();

      const result = await sessionService.saveSession(session);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(scriptInjection);
      expect(result.data?.description).toBe(scriptInjection);
      expect(result.data?.openFiles).toEqual([scriptInjection]);
    });

    it('should handle command injection in git branch names', async () => {
      const maliciousBranches = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'branch && rm -rf /'
      ];

      maliciousBranches.forEach(branch => {
        const session = new Session({
          id: 'test-session',
          name: 'Malicious Branch',
          openFiles: ['/file1.ts'],
          gitStatus: {
            branch,
            isDirty: false,
            dirtyFiles: []
          }
        });

        const result = sessionService.saveSession(session);

        expect(result).resolves.toMatchObject({
          success: true,
          data: expect.objectContaining({
            gitStatus: expect.objectContaining({
              branch
            })
          })
        });
      });
    });
  });

  describe('Method Tests', () => {
    it('should have saveSession method', () => {
      expect(typeof sessionService.saveSession).toBe('function');
    });

    it('should have loadSession method', () => {
      expect(typeof sessionService.loadSession).toBe('function');
    });

    it('should have listSessions method', () => {
      expect(typeof sessionService.listSessions).toBe('function');
    });

    it('should have updateSession method', () => {
      expect(typeof sessionService.updateSession).toBe('function');
    });

    it('should have deleteSession method', () => {
      expect(typeof sessionService.deleteSession).toBe('function');
    });

    it('should have resumeSession method', () => {
      expect(typeof sessionService.resumeSession).toBe('function');
    });

    it('should have createSessionFromCurrentState method', () => {
      expect(typeof sessionService.createSessionFromCurrentState).toBe('function');
    });

    it('should have exportSessions method', () => {
      expect(typeof sessionService.exportSessions).toBe('function');
    });

    it('should have importSessions method', () => {
      expect(typeof sessionService.importSessions).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full session lifecycle', async () => {
      // Create session from current state
      const sessionName = 'Test Session';
      const openFiles = ['/file1.ts', '/file2.ts'];
      const gitStatus = {
        branch: 'main',
        isDirty: false,
        dirtyFiles: []
      };

      mockIDEService.getOpenFiles.mockResolvedValue({
        success: true,
        data: openFiles
      });

      mockGitService.getStatus.mockResolvedValue({
        success: true,
        data: gitStatus
      });

      mockStorageService.writeFile.mockResolvedValue();

      const createResult = await sessionService.createSessionFromCurrentState(sessionName);
      expect(createResult.success).toBe(true);

      // Save session
      const session = createResult.data!;
      const saveResult = await sessionService.saveSession(session);
      expect(saveResult.success).toBe(true);

      // Load session
      const loadResult = await sessionService.loadSession(session.id);
      expect(loadResult.success).toBe(true);

      // Update session
      const updateResult = await sessionService.updateSession(session.id, {
        name: 'Updated Session',
        openFiles: ['/file1.ts', '/file2.ts', '/file3.ts']
      });
      expect(updateResult.success).toBe(true);

      // Resume session
      const resumeResult = await sessionService.resumeSession(updateResult.data!);
      expect(resumeResult.success).toBe(true);

      // Delete session
      const deleteResult = await sessionService.deleteSession(session.id);
      expect(deleteResult.success).toBe(true);
    });

    it('should handle multiple sessions', async () => {
      const sessions = [
        { name: 'Session 1', openFiles: ['/file1.ts'] },
        { name: 'Session 2', openFiles: ['/file2.ts'] },
        { name: 'Session 3', openFiles: ['/file3.ts'] }
      ];

      // Create multiple sessions
      mockIDEService.getOpenFiles.mockResolvedValue({
        success: true,
        data: ['/file1.ts']
      });

      mockGitService.getStatus.mockResolvedValue({
        success: true,
        data: {
          branch: 'main',
          isDirty: false,
          dirtyFiles: []
        }
      });

      mockStorageService.writeFile.mockResolvedValue();

      const createResults = await Promise.all(
        sessions.map(session => sessionService.createSessionFromCurrentState(session.name))
      );

      expect(createResults.every(result => result.success)).toBe(true);

      // List all sessions
      mockStorageService.exists.mockResolvedValue(true);
      mockStorageService.readdir.mockResolvedValue(['session-1.json', 'session-2.json', 'session-3.json']);
      mockStorageService.readFile.mockResolvedValue('{"id":"test","name":"Test","openFiles":[]}');

      const listResult = await sessionService.listSessions();
      expect(listResult.success).toBe(true);
      expect(listResult.data).toHaveLength(3);
    });
  });
}); 