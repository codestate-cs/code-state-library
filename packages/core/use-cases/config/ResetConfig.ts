import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';
import * as path from 'path';

function getDefaultConfig(): Config {
  return {
    version: '1.0.0',
    ide: 'vscode',
    encryption: { enabled: false },
    storagePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate'),
    logger: { 
      level: 'LOG', 
      sinks: ['file'],
      filePath: path.join(process.env.HOME || process.env.USERPROFILE || '.', '.codestate', 'logs', 'codestate.log')
    },
    experimental: {},
    extensions: {},
  };
}

export class ResetConfig {
  private configService: IConfigService;
  constructor(configService?: IConfigService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(): Promise<Result<Config>> {
    const result = await this.configService.setConfig(getDefaultConfig());
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: getDefaultConfig() };
  }
} 