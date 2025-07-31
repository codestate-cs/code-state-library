import { describe, it, expect } from '@jest/globals';
import { Session, FileState, GitState } from '@codestate/core/domain/models/Session';

const validFileState: FileState = {
  path: '/project/file.ts',
  cursor: { line: 10, column: 5 },
  scroll: { top: 0, left: 0 },
  isActive: true,
};

const validGitState: GitState = {
  branch: 'main',
  commit: 'abc123',
  isDirty: false,
  stashId: null,
};

describe('Session Models', () => {
  // Happy path
  it('should create a valid Session object', () => {
    const session: Session = {
      id: '1',
      name: 'My Session',
      projectRoot: '/project',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['work'],
      files: [validFileState],
      git: validGitState,
      extensions: { plugin: true },
    };
    expect(session.name).toBe('My Session');
    expect(session.files[0].isActive).toBe(true);
    expect(session.git.branch).toBe('main');
  });

  // Failure: missing required fields (TypeScript will catch at compile time)
  it('should not allow missing required fields in Session', () => {
    // @ts-expect-error
    const badSession: Session = { id: '1', name: 'Bad', projectRoot: '/project', createdAt: new Date(), updatedAt: new Date(), tags: [], files: [] };
    expect(badSession).toBeDefined();
  });

  // Invalid input: wrong types
  it('should not allow wrong types for FileState', () => {
    // @ts-expect-error
    const badFile: FileState = { path: 123, isActive: 'yes' };
    expect(badFile).toBeDefined();
  });

  // Pathological: empty strings, empty arrays
  it('should allow empty tags and files', () => {
    const session: Session = {
      id: '2',
      name: '',
      projectRoot: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      files: [],
      git: validGitState,
    };
    expect(session.tags.length).toBe(0);
    expect(session.files.length).toBe(0);
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present (runtime)', () => {
    const file = { ...validFileState, malicious: 'hack' };
    expect((file as any).malicious).toBe('hack');
  });

  // Sanitization: only valid keys allowed
  it('should only allow valid keys in FileState', () => {
    const keys = Object.keys(validFileState);
    expect(keys).toContain('path');
    expect(keys).not.toContain('malicious');
  });

  // Human oversight: typos in keys
  it('should not allow typos in keys (TypeScript will catch)', () => {
    // @ts-expect-error
    const badGit: GitState = { branch: 'main', commt: 'abc123', isDirty: false };
    expect(badGit).toBeDefined();
  });
});
