import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigurableLogger } from '../../../../packages/infrastructure/services/ConfigurableLogger/ConfigurableLogger';
import { ILoggerService } from '../../../../packages/core/domain/ports/ILoggerService';
import { ConsoleLogger } from '../../../../packages/infrastructure/services/ConsoleLogger';
import { FileLogger } from '../../../../packages/infrastructure/services/FileLogger';

vi.mock('../../../../packages/infrastructure/services/ConsoleLogger', () => ({
  ConsoleLogger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}));

vi.mock('../../../../packages/infrastructure/services/FileLogger', () => ({
  FileLogger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}));

describe('ConfigurableLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with only ConsoleLogger (happy path)', () => {
    const config = { sinks: ['console'], filePath: undefined };
    const logger = new ConfigurableLogger(config as any);
    expect(ConsoleLogger).toHaveBeenCalledWith(config);
    expect(FileLogger).not.toHaveBeenCalled();
  });

  it('should initialize with both ConsoleLogger and FileLogger', () => {
    const config = { sinks: ['console', 'file'], filePath: '/tmp/log.txt' };
    const logger = new ConfigurableLogger(config as any);
    expect(ConsoleLogger).toHaveBeenCalled();
    expect(FileLogger).toHaveBeenCalledWith(config);
  });

  it('should throw error if filePath is missing for file sink (invalid input)', () => {
    const config = { sinks: ['file'], filePath: undefined };
    expect(() => new ConfigurableLogger(config as any)).toThrowError('filePath must be provided in LoggerConfig for file sink');
  });

  it('should call all sinks for .log, .error, .warn, .debug methods', () => {
    const config = { sinks: ['console', 'file'], filePath: '/tmp/log.txt' };
    const logger = new ConfigurableLogger(config as any);
    logger.log('info', { tag: 'test' });
    logger.error('err', { tag: 'test' });
    logger.warn('warn', { tag: 'test' });
    logger.debug('debug', { tag: 'test' });

    const consoleLoggerInstance = ConsoleLogger.mock.results[0].value;
    const fileLoggerInstance = FileLogger.mock.results[0].value;

    expect(consoleLoggerInstance.log).toHaveBeenCalledWith('info', { tag: 'test' });
    expect(fileLoggerInstance.error).toHaveBeenCalledWith('err', { tag: 'test' });
    expect(consoleLoggerInstance.warn).toHaveBeenCalledWith('warn', { tag: 'test' });
    expect(fileLoggerInstance.debug).toHaveBeenCalledWith('debug', { tag: 'test' });
  });

  it('should handle pathological case: sink throws error', () => {
    const badSink: ILoggerService = {
      log: () => { throw new Error('Sink error'); },
      error: () => { throw new Error('Sink error'); },
      warn: () => { throw new Error('Sink error'); },
      debug: () => { throw new Error('Sink error'); }
    };

    const logger = new ConfigurableLogger({ sinks: [], filePath: undefined } as any);
    (logger as any).sinks = [badSink];

    expect(() => logger.log('fail')).toThrow();
    expect(() => logger.error('fail')).toThrow();
    expect(() => logger.warn('fail')).toThrow();
    expect(() => logger.debug('fail')).toThrow();
  });
});