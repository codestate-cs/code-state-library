// Main entry point for CLI/IDE to interact with Git (no DI required)
import { GitService } from '@codestate/core/services/git/GitService';
import { TerminalService } from '@codestate/infrastructure/services/Terminal/TerminalService';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { ITerminalService } from '@codestate/core/domain/ports/ITerminalService';
import * as path from 'path';
import { Result } from '@codestate/core/domain/models/Result';

export class GitFacade implements IGitService {
  private service: GitService;

  constructor(
    repositoryPath?: string,
    logger?: ILoggerService,
    terminalService?: ITerminalService
  ) {
    const _logger = logger || new FileLogger({ 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    });
    const _terminalService = terminalService || new TerminalService(_logger);
    this.service = new GitService(_terminalService, _logger, repositoryPath);
  }
  async getCurrentCommit(...args: Parameters<IGitService['getCurrentCommit']>) {
    return this.service.getCurrentCommit(...args);
  }

  async commitChanges(...args: Parameters<IGitService['commitChanges']>) {
    return this.service.commitChanges(...args);
  }

  async getIsDirty(...args: Parameters<IGitService['getIsDirty']>) {
    return this.service.getIsDirty(...args);
  }

  async getDirtyData(...args: Parameters<IGitService['getDirtyData']>) {
    return this.service.getDirtyData(...args);
  }

  async getStatus(...args: Parameters<IGitService['getStatus']>) {
    return this.service.getStatus(...args);
  }

  async createStash(...args: Parameters<IGitService['createStash']>) {
    return this.service.createStash(...args);
  }

  async applyStash(...args: Parameters<IGitService['applyStash']>) {
    return this.service.applyStash(...args);
  }

  async listStashes(...args: Parameters<IGitService['listStashes']>) {
    return this.service.listStashes(...args);
  }

  async deleteStash(...args: Parameters<IGitService['deleteStash']>) {
    return this.service.deleteStash(...args);
  }

  async isGitRepository(...args: Parameters<IGitService['isGitRepository']>) {
    return this.service.isGitRepository(...args);
  }

  async getCurrentBranch(...args: Parameters<IGitService['getCurrentBranch']>) {
    return this.service.getCurrentBranch(...args);
  }

  async getRepositoryRoot(...args: Parameters<IGitService['getRepositoryRoot']>) {
    return this.service.getRepositoryRoot(...args);
  }
} 