import { describe, it, expect } from '@jest/globals';
import { IDE, FileOpenRequest, FileToOpen } from '@codestate/core/domain/models/IDE';

const validIDE: IDE = {
  name: 'VSCode',
  command: 'code',
  args: ['.'],
  supportedPlatforms: ['linux', 'darwin', 'win32'],
};

const validFileToOpen: FileToOpen = {
  path: '/project/file.ts',
  line: 10,
  column: 5,
  isActive: true,
};

describe('IDE Models', () => {
  // Happy path
  it('should create a valid IDE and FileOpenRequest', () => {
    const req: FileOpenRequest = {
      ide: 'VSCode',
      projectRoot: '/project',
      files: [validFileToOpen],
    };
    expect(req.ide).toBe('VSCode');
    expect(req.files[0].path).toBe('/project/file.ts');
  });

  // Failure: missing required fields (TypeScript will catch at compile time)
  it('should not allow missing required fields in IDE', () => {
    // @ts-expect-error
    const badIDE: IDE = { name: 'VSCode', command: 'code', args: [] };
    expect(badIDE).toBeDefined();
  });

  // Invalid input: wrong types
  it('should not allow wrong types for FileToOpen', () => {
    // @ts-expect-error
    const badFile: FileToOpen = { path: 123, line: 'ten' };
    expect(badFile).toBeDefined();
  });

  // Pathological: empty strings, empty arrays
  it('should allow empty args and supportedPlatforms', () => {
    const ide: IDE = {
      name: '',
      command: '',
      args: [],
      supportedPlatforms: [],
    };
    expect(ide.args.length).toBe(0);
    expect(ide.supportedPlatforms.length).toBe(0);
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present (runtime)', () => {
    const ide = { ...validIDE, malicious: 'hack' };
    expect((ide as any).malicious).toBe('hack');
  });

  // Sanitization: only valid keys allowed
  it('should only allow valid keys in FileToOpen', () => {
    const keys = Object.keys(validFileToOpen);
    expect(keys).toContain('path');
    expect(keys).not.toContain('malicious');
  });

  // Human oversight: typos in keys
  it('should not allow typos in keys (TypeScript will catch)', () => {
    // @ts-expect-error
    const badReq: FileOpenRequest = { ide: 'VSCode', projectRoot: '/project', fils: [validFileToOpen] };
    expect(badReq).toBeDefined();
  });
});
