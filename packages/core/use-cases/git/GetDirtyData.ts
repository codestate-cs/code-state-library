import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { GitStatus } from '@codestate/core/domain/models/Git';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class GetDirtyData {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService, repositoryPath?: string) {
    this.gitService = gitService || new GitFacade(repositoryPath);
  }
  
  async execute(): Promise<Result<GitStatus>> {
    return this.gitService.getDirtyData();
  }
} 