// Main entry point for logger usage in CLI/IDE (no DI required)
import { ConfigurableLogger } from '@codestate/infrastructure/services/ConfigurableLogger/ConfigurableLogger';
import { LoggerConfig, LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';
import * as path from 'path';

const defaultConfig: LoggerConfig = {
  level: 'LOG',
  sinks: ['file'],
  filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log'),
};

export class ConfigurableLoggerFacade {
  private logger: ConfigurableLogger;

  constructor(config?: Partial<LoggerConfig>) {
    this.logger = new ConfigurableLogger({ ...defaultConfig, ...config });
  }

  log(message: string, meta?: Record<string, unknown>) {
    this.logger.log(message, meta);
  }
  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
  }
  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }
  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }
} 