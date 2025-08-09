import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';

const LOG_LEVEL_PRIORITY = {
  'ERROR': 0,
  'WARN': 1,
  'LOG': 2,
  'DEBUG': 3,
} as const;

export class ConsoleLogger implements ILoggerService {
  private level: LogLevel;
  constructor(config: LoggerConfig) {
    this.level = config.level;
  }
  plainLog(message: string, meta?: Record<string, unknown>): void {
    console.log(message);
    if (meta && Object.keys(meta).length > 0) {
      console.log(meta);
    }
  }
  
  private shouldLog(messageLevel: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[this.level] >= LOG_LEVEL_PRIORITY[messageLevel];
  }
  
  log(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('LOG')) return;
    console.log(`[LOG] [${new Date().toISOString()}] ${message}`);
    if (meta) console.log(meta);
  }
  error(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('ERROR')) return;
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`);
    if (meta) console.error(meta);
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('WARN')) return;
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`);
    if (meta) console.warn(meta);
  }
  debug(message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog('DEBUG')) return;
    const entry = { level: 'debug', timestamp: new Date().toISOString(), message, ...meta };
    console.debug(JSON.stringify(entry));
  }
} 