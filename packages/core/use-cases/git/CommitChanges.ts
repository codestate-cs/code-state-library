import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class CommitChanges {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService) {
    this.gitService = gitService || new GitFacade();
  }
  
  async execute(message: string): Promise<Result<boolean>> {
    return this.gitService.commitChanges(message);
  }
} 