import { describe, it, expect } from '@jest/globals';
import { GitStatus, GitFile, GitFileStatus, GitStash, GitStashResult, GitStashApplyResult } from '@codestate/core/domain/models/Git';

// Helper for a valid GitFile
const validGitFile: GitFile = {
  path: 'src/index.ts',
  status: GitFileStatus.MODIFIED,
  staged: true,
};

describe('Git Models', () => {
  // Happy path
  it('should create a valid GitStatus object', () => {
    const status: GitStatus = {
      isDirty: true,
      dirtyFiles: [validGitFile],
      newFiles: [],
      modifiedFiles: [validGitFile],
      deletedFiles: [],
      untrackedFiles: [],
    };
    expect(status.isDirty).toBe(true);
    expect(status.dirtyFiles[0].status).toBe(GitFileStatus.MODIFIED);
  });

  // Failure: missing required fields (TypeScript will catch at compile time)
  it('should not allow missing required fields in GitFile', () => {
    // @ts-expect-error
    const badFile: GitFile = { path: 'foo', status: GitFileStatus.ADDED };
    expect(badFile).toBeDefined();
  });

  // Invalid input: wrong types
  it('should not allow wrong types for GitFileStatus', () => {
    // @ts-expect-error
    const badFile: GitFile = { path: 'foo', status: 'not-a-status', staged: false };
    expect(badFile).toBeDefined();
  });

  // Pathological: empty strings, empty arrays
  it('should allow empty arrays in GitStatus', () => {
    const status: GitStatus = {
      isDirty: false,
      dirtyFiles: [],
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      untrackedFiles: [],
    };
    expect(status.dirtyFiles.length).toBe(0);
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present (runtime)', () => {
    const file = { ...validGitFile, malicious: 'hack' };
    expect((file as any).malicious).toBe('hack');
  });

  // Sanitization: valid enum values only
  it('should only allow valid GitFileStatus values', () => {
    const statuses = Object.values(GitFileStatus);
    expect(statuses).toContain('modified');
    expect(statuses).not.toContain('hacked');
  });

  // Human oversight: typos in keys
  it('should not allow typos in keys (TypeScript will catch)', () => {
    // @ts-expect-error
    const badStatus: GitStatus = { isDirty: true, dirtyFiles: [], newFiles: [], modifedFiles: [], deletedFiles: [], untrackedFiles: [] };
    expect(badStatus).toBeDefined();
  });

  // GitStash and results
  it('should create a valid GitStash and result objects', () => {
    const stash: GitStash = {
      id: '1',
      name: 'WIP',
      message: 'work in progress',
      timestamp: Date.now(),
      branch: 'main',
    };
    const result: GitStashResult = { success: true, stashId: '1' };
    const applyResult: GitStashApplyResult = { success: false, conflicts: ['src/index.ts'], error: 'conflict' };
    expect(stash.name).toBe('WIP');
    expect(result.success).toBe(true);
    expect(applyResult.conflicts).toContain('src/index.ts');
  });
});
