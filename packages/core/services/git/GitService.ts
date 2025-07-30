import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { GitStatus, GitFile, GitFileStatus, GitStash, GitStashResult, GitStashApplyResult } from '@codestate/core/domain/models/Git';
import { Result } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import { GitError, ErrorCode } from '@codestate/core/domain/types/ErrorTypes';
import { validateGitStatus } from '@codestate/core/domain/schemas/SchemaRegistry';

export class GitService implements IGitService {
  constructor(
    private terminalService: ITerminalService,
    private logger: ILoggerService,
    private repositoryPath?: string
  ) {}

  async getIsDirty(): Promise<Result<boolean>> {
    this.logger.debug('GitService.getIsDirty called');
    try {
      const statusResult = await this.getStatus();
      if (!statusResult.ok) {
        return statusResult;
      }
      return { ok: true, value: statusResult.value.isDirty };
    } catch (error) {
      this.logger.error('Failed to check if repository is dirty', { error });
      return { ok: false, error: new GitError('Failed to check repository status', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async getDirtyData(): Promise<Result<GitStatus>> {
    this.logger.debug('GitService.getDirtyData called');
    return this.getStatus();
  }

  async getStatus(): Promise<Result<GitStatus>> {
    this.logger.debug('GitService.getStatus called');
    try {
      // Check if we're in a git repository
      const isRepoResult = await this.isGitRepository();
      if (!isRepoResult.ok || !isRepoResult.value) {
        return { ok: false, error: new GitError('Not a git repository', ErrorCode.GIT_NOT_REPOSITORY) };
      }

      // Get git status
      const statusResult = await this.terminalService.execute('git status --porcelain', {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!statusResult.ok) {
        this.logger.error('Failed to get git status', { error: statusResult.error });
        return { ok: false, error: new GitError('Failed to get git status', ErrorCode.GIT_COMMAND_FAILED) };
      }

      const files = this.parseGitStatus(statusResult.value.stdout);
      const isDirty = files.some(file => 
        file.status !== GitFileStatus.UNTRACKED || 
        file.staged
      );

      const gitStatus: GitStatus = {
        isDirty,
        dirtyFiles: files.filter(file => file.staged),
        newFiles: files.filter(file => file.status === GitFileStatus.ADDED),
        modifiedFiles: files.filter(file => file.status === GitFileStatus.MODIFIED),
        deletedFiles: files.filter(file => file.status === GitFileStatus.DELETED),
        untrackedFiles: files.filter(file => file.status === GitFileStatus.UNTRACKED)
      };

      this.logger.log('Git status retrieved', { isDirty, fileCount: files.length });
      return { ok: true, value: gitStatus };
    } catch (error) {
      this.logger.error('Failed to get git status', { error });
      return { ok: false, error: new GitError('Failed to get git status', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async createStash(message?: string): Promise<Result<GitStashResult>> {
    this.logger.debug('GitService.createStash called', { message });
    try {
      const timestamp = Date.now();
      const stashName = `codestate-stash-${timestamp}`;
      const stashMessage = message || `CodeState stash created at ${new Date(timestamp).toISOString()}`;

      const stashResult = await this.terminalService.execute(`git stash push -m "${stashMessage}"`, {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!stashResult.ok) {
        this.logger.error('Failed to create stash', { error: stashResult.error });
        return { 
          ok: true, 
          value: { 
            success: false, 
            error: 'Failed to create stash' 
          } 
        };
      }

      // Get the stash list to find our newly created stash
      const listResult = await this.listStashes();
      if (!listResult.ok) {
        return { 
          ok: true, 
          value: { 
            success: false, 
            error: 'Failed to list stashes after creation' 
          } 
        };
      }

      const newStash = listResult.value.find(stash => 
        stash.name.includes(`codestate-stash-${timestamp}`) || 
        stash.message === stashMessage
      );

      if (!newStash) {
        return { 
          ok: true, 
          value: { 
            success: false, 
            error: 'Stash created but could not be found in list' 
          } 
        };
      }

      this.logger.log('Stash created successfully', { stashId: newStash.id, stashName: newStash.name });
      return { 
        ok: true, 
        value: { 
          success: true, 
          stashId: newStash.id 
        } 
      };
    } catch (error) {
      this.logger.error('Failed to create stash', { error });
      return { 
        ok: true, 
        value: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to create stash' 
        } 
      };
    }
  }

  async applyStash(stashName: string): Promise<Result<GitStashApplyResult>> {
    this.logger.debug('GitService.applyStash called', { stashName });
    try {
      const applyResult = await this.terminalService.execute(`git stash apply "${stashName}"`, {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!applyResult.ok) {
        this.logger.error('Failed to apply stash', { error: applyResult.error, stashName });
        return { 
          ok: true, 
          value: { 
            success: false, 
            error: 'Failed to apply stash' 
          } 
        };
      }

      // Check for conflicts
      const statusResult = await this.getStatus();
      const conflicts: string[] = [];
      
      if (statusResult.ok) {
        const status = statusResult.value;
        conflicts.push(...status.modifiedFiles
          .filter(file => file.path.includes('<<<<<<<') || file.path.includes('=======') || file.path.includes('>>>>>>>'))
          .map(file => file.path)
        );
      }

      this.logger.log('Stash applied successfully', { stashName, conflicts: conflicts.length });
      return { 
        ok: true, 
        value: { 
          success: true, 
          conflicts: conflicts.length > 0 ? conflicts : undefined 
        } 
      };
    } catch (error) {
      this.logger.error('Failed to apply stash', { error, stashName });
      return { 
        ok: true, 
        value: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to apply stash' 
        } 
      };
    }
  }

  async listStashes(): Promise<Result<GitStash[]>> {
    this.logger.debug('GitService.listStashes called');
    try {
      const listResult = await this.terminalService.execute('git stash list --format="%H|%gd|%s|%ct"', {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!listResult.ok) {
        this.logger.error('Failed to list stashes', { error: listResult.error });
        return { ok: false, error: new GitError('Failed to list stashes', ErrorCode.GIT_COMMAND_FAILED) };
      }

      const stashes: GitStash[] = [];
      const lines = listResult.value.stdout.trim().split('\n').filter(line => line.length > 0);

      for (const line of lines) {
        const [hash, ref, message, timestamp] = line.split('|');
        if (hash && ref && message && timestamp) {
          stashes.push({
            id: hash,
            name: ref,
            message: message.trim(),
            timestamp: parseInt(timestamp, 10) * 1000, // Convert to milliseconds
            branch: 'unknown' // Git doesn't provide branch info in stash list
          });
        }
      }

      this.logger.log('Stashes listed successfully', { count: stashes.length });
      return { ok: true, value: stashes };
    } catch (error) {
      this.logger.error('Failed to list stashes', { error });
      return { ok: false, error: new GitError('Failed to list stashes', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async deleteStash(stashName: string): Promise<Result<boolean>> {
    this.logger.debug('GitService.deleteStash called', { stashName });
    try {
      const deleteResult = await this.terminalService.execute(`git stash drop "${stashName}"`, {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!deleteResult.ok) {
        this.logger.error('Failed to delete stash', { error: deleteResult.error, stashName });
        return { ok: false, error: new GitError('Failed to delete stash', ErrorCode.GIT_COMMAND_FAILED) };
      }

      this.logger.log('Stash deleted successfully', { stashName });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to delete stash', { error, stashName });
      return { ok: false, error: new GitError('Failed to delete stash', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async isGitRepository(): Promise<Result<boolean>> {
    this.logger.debug('GitService.isGitRepository called');
    try {
      const result = await this.terminalService.execute('git rev-parse --git-dir', {
        cwd: this.repositoryPath,
        timeout: 10000
      });

      return { ok: true, value: result.ok && result.value.exitCode === 0 };
    } catch (error) {
      this.logger.error('Failed to check if directory is git repository', { error });
      return { ok: false, error: new GitError('Failed to check git repository', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async getCurrentBranch(): Promise<Result<string>> {
    this.logger.debug('GitService.getCurrentBranch called');
    try {
      const result = await this.terminalService.execute('git branch --show-current', {
        cwd: this.repositoryPath,
        timeout: 10000
      });

      if (!result.ok) {
        this.logger.error('Failed to get current branch', { error: result.error });
        return { ok: false, error: new GitError('Failed to get current branch', ErrorCode.GIT_COMMAND_FAILED) };
      }
      
      if (result.value.exitCode !== 0) {
        this.logger.error('Failed to get current branch', { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError('Failed to get current branch', ErrorCode.GIT_COMMAND_FAILED) };
      }

      const branch = result.value.stdout.trim();
      this.logger.log('Current branch retrieved', { branch });
      return { ok: true, value: branch };
    } catch (error) {
      this.logger.error('Failed to get current branch', { error });
      return { ok: false, error: new GitError('Failed to get current branch', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async getCurrentCommit(): Promise<Result<string>> {
    this.logger.debug('GitService.getCurrentCommit called');
    try {
      const result = await this.terminalService.execute('git rev-parse HEAD', {
        cwd: this.repositoryPath,
        timeout: 10000
      });

      if (!result.ok) {
        this.logger.error('Failed to get current commit', { error: result.error });
        return { ok: false, error: new GitError('Failed to get current commit', ErrorCode.GIT_COMMAND_FAILED) };
      }
      
      if (result.value.exitCode !== 0) {
        this.logger.error('Failed to get current commit', { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError('Failed to get current commit', ErrorCode.GIT_COMMAND_FAILED) };
      }

      const commit = result.value.stdout.trim();
      this.logger.log('Current commit retrieved', { commit });
      return { ok: true, value: commit };
    } catch (error) {
      this.logger.error('Failed to get current commit', { error });
      return { ok: false, error: new GitError('Failed to get current commit', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async commitChanges(message: string): Promise<Result<boolean>> {
    this.logger.debug('GitService.commitChanges called', { message });
    try {
      // First, add all changes
      const addResult = await this.terminalService.execute('git add .', {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!addResult.ok) {
        this.logger.error('Failed to add changes', { error: addResult.error });
        return { ok: false, error: new GitError('Failed to add changes', ErrorCode.GIT_COMMAND_FAILED) };
      }

      if (addResult.value.exitCode !== 0) {
        this.logger.error('Failed to add changes', { exitCode: addResult.value.exitCode, stderr: addResult.value.stderr });
        return { ok: false, error: new GitError('Failed to add changes', ErrorCode.GIT_COMMAND_FAILED) };
      }

      // Then commit with the provided message
      const commitResult = await this.terminalService.execute(`git commit -m "${message}"`, {
        cwd: this.repositoryPath,
        timeout: 30000
      });

      if (!commitResult.ok) {
        this.logger.error('Failed to commit changes', { error: commitResult.error });
        return { ok: false, error: new GitError('Failed to commit changes', ErrorCode.GIT_COMMAND_FAILED) };
      }

      if (commitResult.value.exitCode !== 0) {
        this.logger.error('Failed to commit changes', { exitCode: commitResult.value.exitCode, stderr: commitResult.value.stderr });
        return { ok: false, error: new GitError('Failed to commit changes', ErrorCode.GIT_COMMAND_FAILED) };
      }

      this.logger.log('Changes committed successfully', { message });
      return { ok: true, value: true };
    } catch (error) {
      this.logger.error('Failed to commit changes', { error });
      return { ok: false, error: new GitError('Failed to commit changes', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  async getRepositoryRoot(): Promise<Result<string>> {
    this.logger.debug('GitService.getRepositoryRoot called');
    try {
      const result = await this.terminalService.execute('git rev-parse --show-toplevel', {
        cwd: this.repositoryPath,
        timeout: 10000
      });

      if (!result.ok) {
        this.logger.error('Failed to get repository root', { error: result.error });
        return { ok: false, error: new GitError('Failed to get repository root', ErrorCode.GIT_COMMAND_FAILED) };
      }
      
      if (result.value.exitCode !== 0) {
        this.logger.error('Failed to get repository root', { exitCode: result.value.exitCode, stderr: result.value.stderr });
        return { ok: false, error: new GitError('Failed to get repository root', ErrorCode.GIT_COMMAND_FAILED) };
      }

      const root = result.value.stdout.trim();
      this.logger.log('Repository root retrieved', { root });
      return { ok: true, value: root };
    } catch (error) {
      this.logger.error('Failed to get repository root', { error });
      return { ok: false, error: new GitError('Failed to get repository root', ErrorCode.GIT_COMMAND_FAILED) };
    }
  }

  private parseGitStatus(statusOutput: string): GitFile[] {
    const files: GitFile[] = [];
    const lines = statusOutput.trim().split('\n').filter(line => line.length > 0);

    for (const line of lines) {
      if (line.length < 3) continue;

      const status = line.substring(0, 2);
      const path = line.substring(3);

      let fileStatus: GitFileStatus;
      let staged = false;

      // Parse git status codes - check for exact matches first
      switch (status) {
        case 'M ': // Modified, not staged
          fileStatus = GitFileStatus.MODIFIED;
          staged = false;
          break;
        case 'A ': // Added, not staged
          fileStatus = GitFileStatus.ADDED;
          staged = false;
          break;
        case 'D ': // Deleted, not staged
          fileStatus = GitFileStatus.DELETED;
          staged = false;
          break;
        case 'R ': // Renamed, not staged
          fileStatus = GitFileStatus.RENAMED;
          staged = false;
          break;
        case 'C ': // Copied, not staged
          fileStatus = GitFileStatus.COPIED;
          staged = false;
          break;
        case '??': // Untracked
          fileStatus = GitFileStatus.UNTRACKED;
          staged = false;
          break;
        default:
          // Check for single character status (staged files)
          if (status.length === 1) {
            switch (status) {
              case 'M': // Modified, staged
                fileStatus = GitFileStatus.MODIFIED;
                staged = true;
                break;
              case 'A': // Added, staged
                fileStatus = GitFileStatus.ADDED;
                staged = true;
                break;
              case 'D': // Deleted, staged
                fileStatus = GitFileStatus.DELETED;
                staged = true;
                break;
              case 'R': // Renamed, staged
                fileStatus = GitFileStatus.RENAMED;
                staged = true;
                break;
              case 'C': // Copied, staged
                fileStatus = GitFileStatus.COPIED;
                staged = true;
                break;
              default:
                // Handle other status codes as modified
                fileStatus = GitFileStatus.MODIFIED;
                staged = true;
                break;
            }
          } else {
            // Handle other status codes as modified
            fileStatus = GitFileStatus.MODIFIED;
            staged = false;
          }
          break;
      }

      files.push({
        path,
        status: fileStatus,
        staged
      });
    }

    return files;
  }
} 