import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalService } from '../../../../packages/infrastructure/services/Terminal/TerminalService';
import { ILoggerService } from '../../../../packages/core/domain/ports/ILoggerService';
import { TerminalError, ErrorCode } from '../../../../packages/core/domain/types/ErrorTypes';

// Mocks
const mockLogger: ILoggerService = {
  debug: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  plainLog: vi.fn(),
};

describe('TerminalService', () => {
  let service: TerminalService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TerminalService(mockLogger);
  });

  it('should execute a valid command (happy path)', async () => {
    const result = await service.execute('echo "hello"');
    expect(result.ok).toBe(true);
    expect(result.value.success).toBe(true);
    expect(result.value.stdout).toContain('hello');
  });

  it('should fail on empty command (invalid input)', async () => {
    const result = await service.execute('');
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(TerminalError);
    expect(result.error.code).toBe(ErrorCode.TERMINAL_COMMAND_FAILED);
  });

  it('should handle command not found (failure path)', async () => {
    const result = await service.execute('nonexistentcommand1234');
    expect(result.ok).toBe(true); // Shell returns exit code, not error
    expect(result.value.success).toBe(false);
    expect(result.value.exitCode).not.toBe(0);
  });

  it('should handle malicious input (command injection)', async () => {
    // This is a safe test, just checks if the service runs the string
    const result = await service.execute('echo harmless && echo injected');
    expect(result.ok).toBe(true);
    expect(result.value.stdout).toContain('harmless');
    expect(result.value.stdout).toContain('injected');
  });

  it('should timeout on long-running command (pathelogical)', async () => {
    const result = await service.execute('sleep 2', { timeout: 500 });
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(TerminalError);
    expect(result.error.code).toBe(ErrorCode.TERMINAL_TIMEOUT);
  });

  it('should execute batch commands (happy path)', async () => {
    const batch = [
      { command: 'echo batch1' },
      { command: 'echo batch2' },
    ];
    const result = await service.executeBatch(batch);
    expect(result.ok).toBe(true);
    expect(result.value.length).toBe(2);
    expect(result.value[0].stdout).toContain('batch1');
    expect(result.value[1].stdout).toContain('batch2');
  });

  it('should fail batch if one command fails (failure path)', async () => {
    const batch = [
      { command: 'echo ok' },
      { command: '' }, // Invalid
    ];
    const result = await service.executeBatch(batch);
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(TerminalError);
  });

  it('should check command availability (happy path)', async () => {
    const result = await service.isCommandAvailable('echo');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return false for unavailable command', async () => {
    const result = await service.isCommandAvailable('nonexistentcommand1234');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(false);
  });

  it('should get shell (happy path)', async () => {
    const result = await service.getShell();
    expect(result.ok).toBe(true);
    expect(typeof result.value).toBe('string');
    expect(result.value.length).toBeGreaterThan(0);
  });

  it('should spawn terminal (human oversight)', async () => {
    // This test only checks that the method returns ok, not that a terminal opens
    const result = await service.spawnTerminal('echo test');
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should fail to spawn terminal with empty command (invalid input)', async () => {
    const result = await service.spawnTerminal('');
    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(TerminalError);
  });
});
