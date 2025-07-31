import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsoleLogger } from '@codestate/infrastructure/services/ConsoleLogger';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';

const makeLogger = (level: LogLevel) => new ConsoleLogger({ level, sinks: ['console'] });

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  let spyLog: any, spyError: any, spyWarn: any, spyDebug: any;

  beforeEach(() => {
    spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    spyDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  // Happy path: all log levels
  it('should log at all levels when set to DEBUG', () => {
    logger = makeLogger('DEBUG');
    logger.log('log');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    expect(spyLog).toHaveBeenCalled();
    expect(spyError).toHaveBeenCalled();
    expect(spyWarn).toHaveBeenCalled();
    expect(spyDebug).toHaveBeenCalled();
  });

  // Happy path: log with meta
  it('should log meta for log, error, warn', () => {
    logger = makeLogger('DEBUG');
    logger.log('log', { foo: 1 });
    logger.error('error', { bar: 2 });
    logger.warn('warn', { baz: 3 });
    expect(spyLog).toHaveBeenCalledWith({ foo: 1 });
    expect(spyError).toHaveBeenCalledWith({ bar: 2 });
    expect(spyWarn).toHaveBeenCalledWith({ baz: 3 });
  });

  // Happy path: debug with meta
  it('should log debug with meta as JSON', () => {
    logger = makeLogger('DEBUG');
    logger.debug('debug', { foo: 'bar' });
    expect(spyDebug).toHaveBeenCalledWith(
      expect.stringContaining('"level":"debug"')
    );
    expect(spyDebug).toHaveBeenCalledWith(
      expect.stringContaining('"foo":"bar"')
    );
  });
  // Invalid input: meta is undefined/null
  it('should not log meta if not provided', () => {
    logger = makeLogger('LOG');
    logger.log('log');
    expect(spyLog).toHaveBeenCalledTimes(1); // only message, not meta
  });

  // Pathological: empty message, empty meta
  it('should handle empty message and empty meta', () => {
    logger = makeLogger('WARN');
    logger.warn('', {});
    expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
    expect(spyWarn).toHaveBeenCalledWith({});
  });
  // Edge: log with unicode and large meta
  it('should log unicode and large meta', () => {
    logger = makeLogger('DEBUG');
    const meta = { emoji: '🚀', long: 'x'.repeat(1000) };
    logger.log('unicode 🚀', meta);
    expect(spyLog).toHaveBeenCalledWith({ emoji: '🚀', long: 'x'.repeat(1000) });
  });

  // Edge: log with deeply nested meta
  it('should log deeply nested meta', () => {
    logger = makeLogger('DEBUG');
    const meta = { a: { b: { c: { d: 1 } } } };
    logger.log('deep', meta);
    expect(spyLog).toHaveBeenCalledWith(meta);
  });

  // Edge: log with different date
  it('should log with mocked date', () => {
    const realDate = Date;
    global.Date = class extends Date {
      constructor() { super(); return new realDate('2020-01-01T00:00:00.000Z'); }
      static now() { return new realDate('2020-01-01T00:00:00.000Z').getTime(); }
    } as any;
    logger = makeLogger('LOG');
    logger.log('date test');
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('2020-01-01T00:00:00.000Z'));
    global.Date = realDate;
  });

  // Failure: plainLog not implemented
  it('should log plain message', () => {
    logger = makeLogger('LOG');
    expect(() => logger.plainLog('plain')).not.toThrow();
  });

  // Invalid input: meta argument
  it('should log meta if provided', () => {
    logger = makeLogger('ERROR');
    logger.error('err', { foo: 'bar' });
    expect(spyError).toHaveBeenCalledWith({ foo: 'bar' });
  });

  // Pathological: empty message
  it('should handle empty message', () => {
    logger = makeLogger('WARN');
    logger.warn('');
    expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'));
  });

  // Malicious: meta with prototype pollution
  it('should log meta with dangerous keys', () => {
    logger = makeLogger('ERROR');
    const meta = { __proto__: { hacked: true } };
    logger.error('danger', meta);
    expect(spyError).toHaveBeenCalledWith(meta);
  });

  // Sanitization: only valid log levels
  it('should only log for valid levels', () => {
    logger = makeLogger('ERROR');
    logger.log('should not log');
    expect(spyLog).not.toHaveBeenCalledWith(expect.stringContaining('should not log'));
  });

  // Human oversight: typo in log method
  it('should not log if method name is misspelled', () => {
    logger = makeLogger('LOG');
    // @ts-expect-error
    expect(() => logger.lgo('typo')).toThrow();
  });
});
