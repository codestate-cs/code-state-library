import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { GitStashApplyResult } from '@codestate/core/domain/models/Git';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class ApplyStash {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService, repositoryPath?: string) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  
  async execute(stashName: string): Promise<Result<GitStashApplyResult>> {
    return this.gitService.applyStash(stashName);
  }
} 