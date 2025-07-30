import { LogLevel } from '../schemas/SchemaRegistry';

export type Environment = 'development' | 'production' | 'test' | 'ci';

export interface EnvironmentConfig {
  environment: Environment;
  logLevel: LogLevel;
  enableDebugLogs: boolean;
  enableFileLogging: boolean;
  enableErrorReporting: boolean;
  enableFeatureFlags: boolean;
}

export const environmentDefaults: Record<Environment, EnvironmentConfig> = {
  development: {
    environment: 'development',
    logLevel: 'DEBUG',
    enableDebugLogs: true,
    enableFileLogging: false,
    enableErrorReporting: false,
    enableFeatureFlags: true,
  },
  production: {
    environment: 'production',
    logLevel: 'WARN',
    enableDebugLogs: false,
    enableFileLogging: true,
    enableErrorReporting: true,
    enableFeatureFlags: false,
  },
  test: {
    environment: 'test',
    logLevel: 'ERROR',
    enableDebugLogs: false,
    enableFileLogging: false,
    enableErrorReporting: false,
    enableFeatureFlags: false,
  },
  ci: {
    environment: 'ci',
    logLevel: 'LOG',
    enableDebugLogs: false,
    enableFileLogging: true,
    enableErrorReporting: true,
    enableFeatureFlags: false,
  },
}; 