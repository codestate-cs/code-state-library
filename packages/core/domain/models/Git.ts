export interface GitStatus {
  isDirty: boolean;
  dirtyFiles: GitFile[];
  newFiles: GitFile[];
  modifiedFiles: GitFile[];
  deletedFiles: GitFile[];
  untrackedFiles: GitFile[];
}

export interface GitFile {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}

export enum GitFileStatus {
  MODIFIED = 'modified',
  ADDED = 'added',
  DELETED = 'deleted',
  UNTRACKED = 'untracked',
  RENAMED = 'renamed',
  COPIED = 'copied',
  UPDATED = 'updated'
}

export interface GitStash {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  branch: string;
}

export interface GitStashResult {
  success: boolean;
  stashId?: string;
  error?: string;
}

export interface GitStashApplyResult {
  success: boolean;
  conflicts?: string[];
  error?: string;
} 