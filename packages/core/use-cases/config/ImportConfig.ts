import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result } from '@codestate/core/domain/models/Result';
import { validateConfig } from '@codestate/core/domain/schemas/SchemaRegistry';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';

export class ImportConfig {
  private configService: IConfigService;
  constructor(configService?: IConfigService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(json: string): Promise<Result<Config>> {
    let parsed: Config;
    try {
      parsed = validateConfig(JSON.parse(json));
    } catch (err: any) {
      return { ok: false, error: err };
    }
    const result = await this.configService.setConfig(parsed);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, value: parsed };
  }
} 