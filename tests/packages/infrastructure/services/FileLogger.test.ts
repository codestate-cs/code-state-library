import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { FileLogger } from '@codestate/infrastructure/services/FileLogger';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';
import * as fs from 'fs';
jest.mock('fs', () => {
  const actual = jest.requireActual('fs') as any;
  return {
    ...actual,
    appendFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
  };
});
import * as path from 'path';

const tempLogFile = path.join(__dirname, 'test-log.log');
const makeLogger = (level: LogLevel, filePath = tempLogFile) => new FileLogger({ level, sinks: ['file'], filePath });

describe('FileLogger', () => {
  let logger: FileLogger;
  let spyAppend: any, spyMkdir: any;

  beforeEach(() => {
    spyAppend = fs.appendFileSync as any;
    spyMkdir = fs.mkdirSync as any;
    (fs.appendFileSync as any).mockClear();
    (fs.mkdirSync as any).mockClear();
  });
  afterEach(() => {
    (fs.appendFileSync as any).mockClear();
    (fs.mkdirSync as any).mockClear();
    try { fs.unlinkSync(tempLogFile); } catch {}
  });

  // Happy path: all log levels
  it('should write logs at all levels when set to DEBUG', () => {
    logger = makeLogger('DEBUG');
    logger.log('log');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    expect(spyAppend).toHaveBeenCalledTimes(4);
  });

  // Happy path: log with meta
  it('should write meta for log, error, warn', () => {
    logger = makeLogger('DEBUG');
    logger.log('log', { foo: 1 });
    logger.error('error', { bar: 2 });
    logger.warn('warn', { baz: 3 });
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('foo'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('bar'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('baz'), expect.anything());
  });

  // Happy path: debug with meta
  it('should write debug with meta as JSON', () => {
    logger = makeLogger('DEBUG');
    logger.debug('debug', { foo: 'bar' });
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"level":"debug"'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"foo":"bar"'), expect.anything());
  });

  // Failure: plainLog not implemented
  it('should log plain message', () => {
    logger = makeLogger('LOG');
    expect(() => logger.plainLog('plain')).not.toThrow();
  });

  // Failure: missing filePath in config
  it('should throw if filePath is missing in config', () => {
    expect(() => new FileLogger({ level: 'LOG', sinks: ['file'] } as any)).toThrow('FileLogger requires filePath in LoggerConfig');
  });

  // Invalid input: meta is undefined/null
  it('should not write meta if not provided', () => {
    logger = makeLogger('LOG');
    logger.log('log');
    expect(spyAppend).toHaveBeenCalledTimes(1);
    expect(spyAppend.mock.calls[0][1]).not.toContain('meta');
  });

  // Pathological: empty message, empty meta
  it('should handle empty message and empty meta', () => {
    logger = makeLogger('WARN');
    logger.warn('', {});
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('"message":""'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('meta'), expect.anything());
  });

  // Malicious: meta with prototype pollution
  it('should write meta with dangerous keys (but JSON.stringify ignores __proto__)', () => {
    logger = makeLogger('ERROR');
    const meta = { __proto__: { hacked: true } };
    logger.error('danger', meta);
    // JSON.stringify ignores __proto__, so meta will be {}
    expect(spyAppend).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('"meta":{}'),
      expect.anything()
    );
  });

  // Sanitization: only valid log levels
  it('should only write for valid levels', () => {
    logger = makeLogger('ERROR');
    logger.log('should not log');
    expect(spyAppend).not.toHaveBeenCalledWith(expect.any(String), expect.stringContaining('should not log'), expect.anything());
    logger.error('should log');
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('should log'), expect.anything());
  });

  // Human oversight: typo in log method
  it('should not log if method name is misspelled', () => {
    logger = makeLogger('LOG');
    // @ts-expect-error
    expect(() => logger.lgo('typo')).toThrow();
  });

  // Edge: log with unicode and large meta
  it('should write unicode and large meta', () => {
    logger = makeLogger('DEBUG');
    const meta = { emoji: '🚀', long: 'x'.repeat(1000) };
    logger.log('unicode 🚀', meta);
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('🚀'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('long'), expect.anything());
  });

  // Edge: log with deeply nested meta
  it('should write deeply nested meta', () => {
    logger = makeLogger('DEBUG');
    const meta = { a: { b: { c: { d: 1 } } } };
    logger.log('deep', meta);
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('deep'), expect.anything());
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('meta'), expect.anything());
  });

  // Edge: log with different date
  it('should write with mocked date', () => {
    const realDate = Date;
    global.Date = class extends Date {
      constructor() { super(); return new realDate('2020-01-01T00:00:00.000Z'); }
      static now() { return new realDate('2020-01-01T00:00:00.000Z').getTime(); }
    } as any;
    logger = makeLogger('LOG');
    logger.log('date test');
    expect(spyAppend).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('2020-01-01T00:00:00.000Z'), expect.anything());
    global.Date = realDate;
  });

  // Directory creation
  it('should create log directory if not exists', () => {
    makeLogger('LOG');
    expect(spyMkdir).toHaveBeenCalled();
  });
});
