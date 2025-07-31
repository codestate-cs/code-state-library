import { ILoggerService, LogLevel, LoggerConfig } from '@codestate/core/domain/ports/ILoggerService';
import { ConsoleLogger } from '../ConsoleLogger';
import { FileLogger } from '../FileLogger';
import { LoggerConfig as ValidatedLoggerConfig } from '@codestate/core/domain/schemas/SchemaRegistry';

export class ConfigurableLogger implements ILoggerService {
  private sinks: ILoggerService[] = [];

  constructor(config: ValidatedLoggerConfig) {
    if (config.sinks.includes('console')) {
      this.sinks.push(new ConsoleLogger(config));
    }
    if (config.sinks.includes('file')) {
      if (!config.filePath) throw new Error('filePath must be provided in LoggerConfig for file sink');
      this.sinks.push(new FileLogger(config));
    }
  }
  plainLog(message: string, meta?: Record<string, unknown>): void {
    this.sinks.forEach(sink => sink.plainLog(message, meta));
  }

  log(message: string, meta?: Record<string, unknown>): void {
    this.sinks.forEach(sink => sink.log(message, meta));
  }
  error(message: string, meta?: Record<string, unknown>): void {
    this.sinks.forEach(sink => sink.error(message, meta));
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    this.sinks.forEach(sink => sink.warn(message, meta));
  }
  debug(message: string, meta?: Record<string, unknown>): void {
    this.sinks.forEach(sink => sink.debug(message, meta));
  }
} 