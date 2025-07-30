import { Environment, EnvironmentConfig, environmentDefaults } from '../types/Environment';
import * as fs from 'fs';
import * as path from 'path';

export class EnvironmentService {
  private config: EnvironmentConfig;

  constructor(envFilePath?: string) {
    this.config = this.loadEnvironmentConfig(envFilePath);
  }

  private loadEnvironmentConfig(envFilePath?: string): EnvironmentConfig {
    // Default to development if no .env file or NODE_ENV
    const defaultEnv: Environment = 'development';
    
    // Try to load from .env file
    const envFile = envFilePath || '.env';
    let envVars: Record<string, string> = {};
    
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envVars = this.parseEnvFile(envContent);
    }

    // Determine environment (env file > NODE_ENV > default)
    const envName = (envVars.NODE_ENV || process.env.NODE_ENV || defaultEnv) as Environment;
    
    // Get base config for this environment
    const baseConfig = environmentDefaults[envName] || environmentDefaults.development;
    
    // Override with .env values if present
    return {
      ...baseConfig,
      environment: envName,
      logLevel: (envVars.LOG_LEVEL || process.env.LOG_LEVEL || baseConfig.logLevel) as any,
      enableDebugLogs: envVars.ENABLE_DEBUG_LOGS === 'true' || baseConfig.enableDebugLogs,
      enableFileLogging: envVars.ENABLE_FILE_LOGGING === 'true' || baseConfig.enableFileLogging,
      enableErrorReporting: envVars.ENABLE_ERROR_REPORTING === 'true' || baseConfig.enableErrorReporting,
      enableFeatureFlags: envVars.ENABLE_FEATURE_FLAGS === 'true' || baseConfig.enableFeatureFlags,
    };
  }

  private parseEnvFile(content: string): Record<string, string> {
    const vars: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
    
    return vars;
  }

  getEnvironment(): Environment {
    return this.config.environment;
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isTest(): boolean {
    return this.config.environment === 'test';
  }

  isCI(): boolean {
    return this.config.environment === 'ci';
  }

  shouldEnableDebugLogs(): boolean {
    return this.config.enableDebugLogs;
  }

  shouldEnableFileLogging(): boolean {
    return this.config.enableFileLogging;
  }

  shouldEnableErrorReporting(): boolean {
    return this.config.enableErrorReporting;
  }

  shouldEnableFeatureFlags(): boolean {
    return this.config.enableFeatureFlags;
  }
} 