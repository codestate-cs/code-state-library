import { LoggerConfig } from '../schemas/SchemaRegistry';

export interface EncryptionConfig {
  enabled: boolean;
  encryptionKey?: string;
}

export interface Config {
  version: string;
  ide: string;
  encryption: EncryptionConfig;
  storagePath: string;
  logger: LoggerConfig;
  experimental?: Record<string, boolean>;
  extensions?: Record<string, unknown>;
} 