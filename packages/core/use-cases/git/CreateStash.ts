import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { GitStashResult } from '@codestate/core/domain/models/Git';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class CreateStash {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService, repositoryPath?: string) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  
  async execute(message?: string): Promise<Result<GitStashResult>> {
    return this.gitService.createStash(message);
  }
} 