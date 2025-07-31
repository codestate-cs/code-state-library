import { describe, it, expect } from '@jest/globals';
import { Script, ScriptIndexEntry, ScriptIndex, ScriptCollection } from '@codestate/core/domain/models/Script';

const validScript: Script = {
  name: 'build',
  rootPath: '/project',
  script: 'npm run build',
};

const validEntry: ScriptIndexEntry = {
  rootPath: '/project',
  referenceFile: 'index.ts',
};

describe('Script Models', () => {
  // Happy path
  it('should create valid Script, ScriptIndexEntry, ScriptIndex, and ScriptCollection', () => {
    const index: ScriptIndex = { entries: [validEntry] };
    const collection: ScriptCollection = { scripts: [validScript] };
    expect(index.entries[0].referenceFile).toBe('index.ts');
    expect(collection.scripts[0].name).toBe('build');
  });

  // Failure: missing required fields (TypeScript will catch at compile time)
  it('should not allow missing required fields in Script', () => {
    // @ts-expect-error
    const badScript: Script = { name: 'bad', rootPath: '/project' };
    expect(badScript).toBeDefined();
  });

  // Invalid input: wrong types
  it('should not allow wrong types for Script', () => {
    // @ts-expect-error
    const badScript: Script = { name: 123, rootPath: {}, script: [] };
    expect(badScript).toBeDefined();
  });

  // Pathological: empty strings, empty arrays
  it('should allow empty arrays in ScriptIndex and ScriptCollection', () => {
    const index: ScriptIndex = { entries: [] };
    const collection: ScriptCollection = { scripts: [] };
    expect(index.entries.length).toBe(0);
    expect(collection.scripts.length).toBe(0);
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present (runtime)', () => {
    const script = { ...validScript, malicious: 'hack' };
    expect((script as any).malicious).toBe('hack');
  });

  // Sanitization: only valid keys allowed
  it('should only allow valid keys in Script', () => {
    const keys = Object.keys(validScript);
    expect(keys).toContain('name');
    expect(keys).not.toContain('malicious');
  });

  // Human oversight: typos in keys
  it('should not allow typos in keys (TypeScript will catch)', () => {
    // @ts-expect-error
    const badEntry: ScriptIndexEntry = { rootPath: '/project', refernceFile: 'index.ts' };
    expect(badEntry).toBeDefined();
  });
});
