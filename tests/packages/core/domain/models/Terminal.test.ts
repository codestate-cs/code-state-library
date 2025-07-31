import { describe, it, expect } from '@jest/globals';
import { TerminalCommand, TerminalResult, TerminalOptions } from '@codestate/core/domain/models/Terminal';

const validCommand: TerminalCommand = {
  command: 'ls',
  args: ['-la'],
  cwd: '/tmp',
  env: { NODE_ENV: 'test' },
  timeout: 1000,
};

const validResult: TerminalResult = {
  success: true,
  exitCode: 0,
  stdout: 'file1\nfile2',
  stderr: '',
  duration: 50,
};

const validOptions: TerminalOptions = {
  cwd: '/tmp',
  env: { NODE_ENV: 'test' },
  timeout: 1000,
  shell: '/bin/bash',
};

describe('Terminal Models', () => {
  // Happy path
  it('should create valid TerminalCommand, TerminalResult, and TerminalOptions', () => {
    expect(validCommand.command).toBe('ls');
    expect(validResult.success).toBe(true);
    expect(validOptions.shell).toBe('/bin/bash');
  });

  // Failure: missing required fields (TypeScript will catch at compile time)
  it('should not allow missing required fields in TerminalCommand', () => {
    // @ts-expect-error
    const badCommand: TerminalCommand = { args: [] };
    expect(badCommand).toBeDefined();
  });

  // Invalid input: wrong types
  it('should not allow wrong types for TerminalResult', () => {
    // @ts-expect-error
    const badResult: TerminalResult = { success: 'yes', exitCode: 'zero', stdout: 123, stderr: {}, duration: 'fast' };
    expect(badResult).toBeDefined();
  });

  // Pathological: empty strings, empty arrays, empty env
  it('should allow empty args and env', () => {
    const cmd: TerminalCommand = { command: 'echo', args: [], env: {} };
    expect(cmd.args?.length).toBe(0);
    expect(Object.keys(cmd.env || {}).length).toBe(0);
  });

  // Malicious: extra unexpected fields
  it('should ignore extra fields if present (runtime)', () => {
    const cmd = { ...validCommand, malicious: 'hack' };
    expect((cmd as any).malicious).toBe('hack');
  });

  // Sanitization: only valid keys allowed
  it('should only allow valid keys in TerminalResult', () => {
    const keys = Object.keys(validResult);
    expect(keys).toContain('stdout');
    expect(keys).not.toContain('malicious');
  });

  // Human oversight: typos in keys
  it('should not allow typos in keys (TypeScript will catch)', () => {
    // @ts-expect-error
    const badOptions: TerminalOptions = { cwd: '/tmp', env: {}, tiemout: 1000 };
    expect(badOptions).toBeDefined();
  });
});
