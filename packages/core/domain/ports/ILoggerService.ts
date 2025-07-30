export interface ILoggerService {
  log(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  plainLog(message: string, meta?: Record<string, unknown>): void;
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  LOG = 2,
  DEBUG = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  sinks: Array<'console' | 'file'>;
  filePath?: string; // Required if 'file' sink is used
} 