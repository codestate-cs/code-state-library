import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CLILogger } from '../../../../packages/infrastructure/services/CLILogger/CLILogger';

describe('CLILogger', () => {
  let logger: CLILogger;

  beforeEach(() => {
    logger = new CLILogger();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log plain messages with plainLog (happy path)', () => {
    logger.plainLog('Plain message');
    expect(console.log).toHaveBeenCalledWith('Plain message');
  });

  it('should log plain messages with meta (happy path)', () => {
    logger.plainLog('Plain message', { context: 'test' });
    expect(console.log).toHaveBeenCalledWith('Plain message');
    expect(console.log).toHaveBeenCalledWith({ context: 'test' });
  });

  it('should log messages with prefix (happy path)', () => {
    logger.log('Info message');
    expect(console.log).toHaveBeenCalledWith('✅ Info message');
  });

  it('should log error messages with prefix (happy path)', () => {
    logger.error('Error occurred');
    expect(console.error).toHaveBeenCalledWith('❌ Error occurred');
  });

  it('should log warn messages with prefix (happy path)', () => {
    logger.warn('Be careful');
    expect(console.warn).toHaveBeenCalledWith('⚠️ Be careful');
  });

  it('should not log debug messages (pathological, intentional silence)', () => {
    logger.debug('Debug info');
    expect(console.log).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should handle structured metadata for log', () => {
    const meta = { source: 'test-log' };
    logger.log('Hello', meta);
    expect(console.log).toHaveBeenCalledWith(meta);
  });

  it('should handle structured metadata for error', () => {
    const meta = { reason: 'test-error' };
    logger.error('Error', meta);
    expect(console.error).toHaveBeenCalledWith(meta);
  });

  it('should handle structured metadata for warn', () => {
    const meta = { detail: 'test-warning' };
    logger.warn('Warning', meta);
    expect(console.error).toHaveBeenCalledWith(meta);
  });

  it('should skip metadata if empty or undefined (human oversight)', () => {
    logger.log('No metadata', {});
    logger.error('No metadata', undefined);
    expect(console.log).toHaveBeenCalledWith('✅ No metadata');
    expect(console.error).toHaveBeenCalledWith('❌ No metadata');
  });

  it('should handle unexpected non-object metadata gracefully (malicious/invalid)', () => {
    logger.log('Bad meta' as any, 'string-meta' as any);
    expect(console.log).toHaveBeenCalledWith('✅ Bad meta');
    // Note: No meta output expected due to type mismatch
  });
});