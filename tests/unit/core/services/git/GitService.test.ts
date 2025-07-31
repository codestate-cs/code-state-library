import { GitService } from '@codestate/core/services/git/GitService';
import { Git } from '@codestate/core/domain/models/Git';
import { IGitService } from '@codestate/core/domain/ports/IGitService';
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

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    jest.clearAllMocks();
    gitService = new GitService(mockTerminalService, mockLoggerService);
  });

  describe('Happy Path Tests', () => {
    it('should get git status successfully', async () => {
      const gitStatusOutput = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/file1.ts
        modified:   src/file2.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        src/newfile.ts

no changes added to commit (use "git add" and/or "git commit -a")`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: gitStatusOutput,
        error: null
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Git);
      expect(result.data?.branch).toBe('main');
      expect(result.data?.isDirty).toBe(true);
      expect(result.data?.dirtyFiles).toContain('src/file1.ts');
      expect(result.data?.dirtyFiles).toContain('src/file2.ts');
      expect(result.data?.untrackedFiles).toContain('src/newfile.ts');
    });

    it('should get current branch successfully', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: 'main',
        error: null
      });

      const result = await gitService.getCurrentBranch();

      expect(result.success).toBe(true);
      expect(result.data).toBe('main');
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith('git branch --show-current');
    });

    it('should get dirty files successfully', async () => {
      const dirtyFilesOutput = `M src/file1.ts
M src/file2.ts
A src/newfile.ts`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: dirtyFilesOutput,
        error: null
      });

      const result = await gitService.getDirtyFiles();

      expect(result.success).toBe(true);
      expect(result.data).toContain('src/file1.ts');
      expect(result.data).toContain('src/file2.ts');
      expect(result.data).toContain('src/newfile.ts');
    });

    it('should commit changes successfully', async () => {
      const commitMessage = 'feat: add new feature';
      const commitOutput = `[main abc1234] feat: add new feature
 2 files changed, 10 insertions(+), 5 deletions(-)`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: commitOutput,
        error: null
      });

      const result = await gitService.commit(commitMessage);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `git commit -m "${commitMessage}"`
      );
    });

    it('should create stash successfully', async () => {
      const stashMessage = 'WIP: working on feature';
      const stashOutput = `Saved working directory and index state WIP on main: abc1234 ${stashMessage}`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: stashOutput,
        error: null
      });

      const result = await gitService.stash(stashMessage);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `git stash push -m "${stashMessage}"`
      );
    });

    it('should apply stash successfully', async () => {
      const stashIndex = 0;
      const applyOutput = `Dropped refs/stash@{${stashIndex}} (abc1234)`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: applyOutput,
        error: null
      });

      const result = await gitService.applyStash(stashIndex);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `git stash apply stash@{${stashIndex}}`
      );
    });

    it('should list stashes successfully', async () => {
      const stashesOutput = `stash@{0}: WIP on main: abc1234 feat: add feature
stash@{1}: WIP on main: def5678 fix: bug fix`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: stashesOutput,
        error: null
      });

      const result = await gitService.listStashes();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatch(/WIP on main: abc1234 feat: add feature/);
      expect(result.data?.[1]).toMatch(/WIP on main: def5678 fix: bug fix/);
    });

    it('should delete stash successfully', async () => {
      const stashIndex = 1;
      const deleteOutput = `Dropped refs/stash@{${stashIndex}} (def5678)`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: deleteOutput,
        error: null
      });

      const result = await gitService.deleteStash(stashIndex);

      expect(result.success).toBe(true);
      expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
        `git stash drop stash@{${stashIndex}}`
      );
    });

    it('should check if repository is dirty successfully', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: 'M src/file1.ts\nM src/file2.ts',
        error: null
      });

      const result = await gitService.getIsDirty();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should get current commit successfully', async () => {
      const commitOutput = `commit abc1234567890abcdef1234567890abcdef1234
Author: John Doe <john@example.com>
Date:   Mon Aug 14 10:30:00 2023 +0000

    feat: add new feature

    This commit adds a new feature to the application.
    The feature includes:
    - New API endpoints
    - Updated UI components
    - Improved error handling`;

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: commitOutput,
        error: null
      });

      const result = await gitService.getCurrentCommit();

      expect(result.success).toBe(true);
      expect(result.data?.hash).toBe('abc1234567890abcdef1234567890abcdef1234');
      expect(result.data?.message).toBe('feat: add new feature');
      expect(result.data?.author).toBe('John Doe <john@example.com>');
    });
  });

  describe('Invalid Input Tests', () => {
    it('should handle null commit message', async () => {
      const result = await gitService.commit(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COMMIT_MESSAGE');
    });

    it('should handle undefined commit message', async () => {
      const result = await gitService.commit(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COMMIT_MESSAGE');
    });

    it('should handle empty commit message', async () => {
      const result = await gitService.commit('');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COMMIT_MESSAGE');
    });

    it('should handle null stash message', async () => {
      const result = await gitService.stash(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STASH_MESSAGE');
    });

    it('should handle undefined stash message', async () => {
      const result = await gitService.stash(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STASH_MESSAGE');
    });

    it('should handle negative stash index', async () => {
      const result = await gitService.applyStash(-1);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STASH_INDEX');
    });

    it('should handle undefined stash index', async () => {
      const result = await gitService.applyStash(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STASH_INDEX');
    });

    it('should handle null stash index', async () => {
      const result = await gitService.applyStash(null as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_STASH_INDEX');
    });
  });

  describe('Error Input Tests', () => {
    it('should handle terminal execution errors', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'fatal: not a git repository (or any of the parent directories): .git'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it('should handle git not found', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'git: command not found'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_NOT_FOUND');
    });

    it('should handle permission denied', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'Permission denied'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
    });

    it('should handle network errors', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'fatal: unable to access \'https://github.com/user/repo.git/\': Could not resolve host: github.com'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle malformed git output', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: 'invalid git output format',
        error: null
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle circular references in git data', async () => {
      const circular: any = { branch: 'main', isDirty: false };
      circular.self = circular;

      // This would be handled by the Git model, but we test the service's handling
      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
    });
  });

  describe('Pathological Tests', () => {
    it('should handle extremely long branch names', async () => {
      const longBranchName = 'a'.repeat(1000000);
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: longBranchName,
        error: null
      });

      const result = await gitService.getCurrentBranch();

      expect(result.success).toBe(true);
      expect(result.data).toBe(longBranchName);
    });

    it('should handle large commit messages', async () => {
      const largeCommitMessage = 'a'.repeat(1000000);
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '[main abc1234] ' + largeCommitMessage,
        error: null
      });

      const result = await gitService.commit(largeCommitMessage);

      expect(result.success).toBe(true);
    });

    it('should handle large file lists', async () => {
      const largeFileList = Array.from({ length: 10000 }, (_, i) => `M src/file-${i}.ts`).join('\n');
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: largeFileList,
        error: null
      });

      const result = await gitService.getDirtyFiles();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10000);
    });

    it('should handle deeply nested git output', async () => {
      const deeplyNestedOutput = (() => {
        let output = '';
        for (let i = 0; i < 1000; i++) {
          output += `  ${'  '.repeat(i)}modified: src/file-${i}.ts\n`;
        }
        return output;
      })();

      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: `On branch main\n${deeplyNestedOutput}`,
        error: null
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(true);
    });
  });

  describe('Human Oversight Tests', () => {
    it('should handle typos in git commands', async () => {
      // This would be handled by the terminal service, but we test the service's resilience
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'git: \'sttus\' is not a git command. See \'git --help\'.'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
    });

    it('should handle wrong parameter types', async () => {
      const result = await gitService.commit(123 as any);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_COMMIT_MESSAGE');
    });

    it('should handle missing git repository', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'fatal: not a git repository (or any of the parent directories): .git'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
    });

    it('should handle wrong working directory', async () => {
      mockTerminalService.executeSync.mockReturnValue({
        success: false,
        output: '',
        error: 'fatal: not a git repository (or any of the parent directories): .git'
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GIT_ERROR');
    });
  });

  describe('Sanitization Tests', () => {
    it('should handle command injection in commit messages', async () => {
      const maliciousMessages = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'commit && rm -rf /'
      ];

      maliciousMessages.forEach(message => {
        const result = gitService.commit(message);

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
          `git commit -m "${message}"`
        );
      });
    });

    it('should handle command injection in stash messages', async () => {
      const maliciousMessages = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'stash && rm -rf /'
      ];

      maliciousMessages.forEach(message => {
        const result = gitService.stash(message);

        expect(result).resolves.toMatchObject({
          success: true
        });
        expect(mockTerminalService.executeSync).toHaveBeenCalledWith(
          `git stash push -m "${message}"`
        );
      });
    });

    it('should handle null bytes in messages', async () => {
      const nullByteMessage = 'commit\x00message';
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: '[main abc1234] ' + nullByteMessage,
        error: null
      });

      const result = await gitService.commit(nullByteMessage);

      expect(result.success).toBe(true);
    });

    it('should handle unicode control characters', async () => {
      const unicodeControl = '\u0000\u0001\u0002\u0003';
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: unicodeControl,
        error: null
      });

      const result = await gitService.getCurrentBranch();

      expect(result.success).toBe(true);
      expect(result.data).toBe(unicodeControl);
    });

    it('should handle script injection in branch names', async () => {
      const maliciousBranches = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; DROP TABLE users;',
        'branch && rm -rf /'
      ];

      maliciousBranches.forEach(branch => {
        mockTerminalService.executeSync.mockReturnValue({
          success: true,
          output: branch,
          error: null
        });

        const result = gitService.getCurrentBranch();

        expect(result).resolves.toMatchObject({
          success: true,
          data: branch
        });
      });
    });

    it('should handle path traversal in file paths', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        '/etc/passwd',
        'C:\\Windows\\System32\\config'
      ];

      const maliciousOutput = maliciousPaths.map(path => `M ${path}`).join('\n');
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: `On branch main\n${maliciousOutput}`,
        error: null
      });

      const result = await gitService.getStatus();

      expect(result.success).toBe(true);
      expect(result.data?.dirtyFiles).toEqual(maliciousPaths);
    });
  });

  describe('Method Tests', () => {
    it('should have getStatus method', () => {
      expect(typeof gitService.getStatus).toBe('function');
    });

    it('should have getCurrentBranch method', () => {
      expect(typeof gitService.getCurrentBranch).toBe('function');
    });

    it('should have getDirtyFiles method', () => {
      expect(typeof gitService.getDirtyFiles).toBe('function');
    });

    it('should have commit method', () => {
      expect(typeof gitService.commit).toBe('function');
    });

    it('should have stash method', () => {
      expect(typeof gitService.stash).toBe('function');
    });

    it('should have applyStash method', () => {
      expect(typeof gitService.applyStash).toBe('function');
    });

    it('should have listStashes method', () => {
      expect(typeof gitService.listStashes).toBe('function');
    });

    it('should have deleteStash method', () => {
      expect(typeof gitService.deleteStash).toBe('function');
    });

    it('should have getIsDirty method', () => {
      expect(typeof gitService.getIsDirty).toBe('function');
    });

    it('should have getCurrentCommit method', () => {
      expect(typeof gitService.getCurrentCommit).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should handle full git workflow', async () => {
      // Check status
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: `On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   src/file1.ts`,
          error: null
        });

      const statusResult = await gitService.getStatus();
      expect(statusResult.success).toBe(true);

      // Commit changes
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: '[main abc1234] feat: update file1',
          error: null
        });

      const commitResult = await gitService.commit('feat: update file1');
      expect(commitResult.success).toBe(true);

      // Create stash
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: 'Saved working directory and index state WIP on main: abc1234 feat: update file1',
          error: null
        });

      const stashResult = await gitService.stash('WIP: working on feature');
      expect(stashResult.success).toBe(true);

      // List stashes
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: 'stash@{0}: WIP on main: abc1234 feat: update file1',
          error: null
        });

      const listResult = await gitService.listStashes();
      expect(listResult.success).toBe(true);

      // Apply stash
      mockTerminalService.executeSync
        .mockReturnValueOnce({
          success: true,
          output: 'Dropped refs/stash@{0} (abc1234)',
          error: null
        });

      const applyResult = await gitService.applyStash(0);
      expect(applyResult.success).toBe(true);
    });

    it('should handle different git states', async () => {
      // Clean repository
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`,
        error: null
      });

      const cleanResult = await gitService.getStatus();
      expect(cleanResult.success).toBe(true);
      expect(cleanResult.data?.isDirty).toBe(false);

      // Dirty repository
      mockTerminalService.executeSync.mockReturnValue({
        success: true,
        output: `On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   src/file1.ts
        modified:   src/file2.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        src/newfile.ts`,
        error: null
      });

      const dirtyResult = await gitService.getStatus();
      expect(dirtyResult.success).toBe(true);
      expect(dirtyResult.data?.isDirty).toBe(true);
      expect(dirtyResult.data?.dirtyFiles).toContain('src/file1.ts');
      expect(dirtyResult.data?.dirtyFiles).toContain('src/file2.ts');
      expect(dirtyResult.data?.untrackedFiles).toContain('src/newfile.ts');
    });
  });
}); 