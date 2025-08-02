import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';

export class ExportConfig {
  private configService: IConfigService;
  constructor(configService?: IConfigService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(): Promise<Result<string>> {
    const result = await this.configService.getConfig();
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: JSON.stringify(result.value, null, 2) };
  }
} 