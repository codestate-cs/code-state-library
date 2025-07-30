export interface Session {
  id: string;
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  files: FileState[];
  git: GitState;
  extensions?: Record<string, unknown>;
}

export interface FileState {
  path: string;
  cursor?: { line: number; column: number };
  scroll?: { top: number; left: number };
  isActive: boolean;
}

export interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}