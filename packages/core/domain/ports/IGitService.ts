import { GitStatus, GitStash, GitStashResult, GitStashApplyResult } from '../models/Git';
import { Result } from '../models/Result';

export interface IGitService {
  // Status operations
  getIsDirty(): Promise<Result<boolean>>;
  getDirtyData(): Promise<Result<GitStatus>>;
  getStatus(): Promise<Result<GitStatus>>;
  
  // Stash operations
  createStash(message?: string): Promise<Result<GitStashResult>>;
  applyStash(stashName: string): Promise<Result<GitStashApplyResult>>;
  listStashes(): Promise<Result<GitStash[]>>;
  deleteStash(stashName: string): Promise<Result<boolean>>;
  
  // Repository operations
  isGitRepository(): Promise<Result<boolean>>;
  getCurrentBranch(): Promise<Result<string>>;
  getCurrentCommit(): Promise<Result<string>>;
  commitChanges(message: string): Promise<Result<boolean>>;
  isGitConfigured(): Promise<Result<boolean>>;
  getRepositoryRoot(): Promise<Result<string>>;
} 