import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class DeleteStash {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService, repositoryPath?: string) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  
  async execute(stashName: string): Promise<Result<boolean>> {
    return this.gitService.deleteStash(stashName);
  }
} 