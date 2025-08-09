import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';
import { appendFileSync, mkdirSync } from 'fs';
import * as path from 'path';

const LOG_LEVEL_PRIORITY = {
  'ERROR': 0,
  'WARN': 1,
  'LOG': 2,
  'DEBUG': 3,
} as const;

export class FileLogger implements ILoggerService {
  private level: LogLevel;
  private filePath: string;

  constructor(config: LoggerConfig) {
    if (!config.filePath) throw new Error('FileLogger requires filePath in LoggerConfig');
    this.level = config.level;
    this.filePath = config.filePath;
    this.ensureLogDirectory();
  }
  plainLog(message: string, meta?: Record<string, unknown>): void {
    const entry = {
      level: 'plain',
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta } : {})
    };
    appendFileSync(this.filePath, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.filePath);
    try {
      mkdirSync(logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[this.level] >= LOG_LEVEL_PRIORITY[messageLevel];
  }

  private write(level: string, message: string, meta?: Record<string, unknown>) {
    const entry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...(meta ? { meta } : {})
    };
    appendFileSync(this.filePath, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
  }

  log(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('LOG')) return;
    this.write('log', message, meta);
  }
  error(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('ERROR')) return;
    this.write('error', message, meta);
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('WARN')) return;
    this.write('warn', message, meta);
  }
  debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('DEBUG')) return;
    this.write('debug', message, meta);
  }
} 