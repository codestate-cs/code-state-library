import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

export class CLILogger implements ILoggerService {
  
  plainLog(message: string, meta?: Record<string, unknown>): void {
    console.log(message);
    if (meta && Object.keys(meta).length > 0) {
      console.log(meta);
    }
  }
  
  log(message: string, meta?: Record<string, unknown>): void {
    console.log(`✅ ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.log(meta);
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`❌ ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.error(meta);
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`⚠️ ${message}`);
    if (meta && Object.keys(meta).length > 0) {
      console.error(meta);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    // CLI logger filters out debug messages - they're not shown to users
    // This prevents cluttering the CLI output with verbose debug info
  }
} 