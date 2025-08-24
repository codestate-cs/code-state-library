import { Config } from '@codestate/core/domain/models/Config';
import { LogLevel } from '@codestate/core/domain/schemas/SchemaRegistry';
import * as path from 'path';

function getPackageVersion(): string {
  // Use build-time injected version or fallback
  // For CLI builds, this should be injected during build process
  return process.env.PACKAGE_VERSION || process.env.npm_package_version || '1.4.7';
}

export function getDefaultConfig(dataDir?: string): Config {
  const storagePath = dataDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate');
  
  return {
    version: getPackageVersion(),
    ide: 'vscode',
    encryption: { enabled: false },
    storagePath,
    logger: { 
      level: 'LOG' as LogLevel, 
      sinks: ['file'] as const,
      filePath: path.join(storagePath, 'logs', 'codestate.log')
    },
    experimental: {},
    extensions: {},
  };
} 