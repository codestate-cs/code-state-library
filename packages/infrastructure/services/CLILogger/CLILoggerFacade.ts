// Main entry point for CLI logger usage (no DI required)
import { CLILogger } from './CLILogger';

export class CLILoggerFacade {
  private logger: CLILogger;

  constructor() {
    this.logger = new CLILogger();
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

  plainLog(message: string, meta?: Record<string, unknown>) {
    this.logger.plainLog(message, meta);
  }

  // Note: warn and debug methods are intentionally not exposed
  // to keep CLI output clean and user-friendly
} 