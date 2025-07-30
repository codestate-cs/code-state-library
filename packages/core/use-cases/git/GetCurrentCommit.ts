import { IGitService } from '@codestate/core/domain/ports/IGitService';
import { Result } from '@codestate/core/domain/models/Result';
import { GitFacade } from '@codestate/core/services/git/GitFacade';

export class GetCurrentCommit {
  private gitService: IGitService;
  
  constructor(gitService?: IGitService) {
    this.gitService = gitService || new GitFacade();
  }
  
  async execute(): Promise<Result<string>> {
    return this.gitService.getCurrentCommit();
  }
} 