import { IConfigService } from '@codestate/core/domain/ports/IConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result } from '@codestate/core/domain/models/Result';
import { ConfigFacade } from '@codestate/core/services/config/ConfigFacade';

export class GetConfig {
  private configService: IConfigService;
  constructor(configService?: IConfigService) {
    this.configService = configService || new ConfigFacade();
  }
  async execute(): Promise<Result<Config>> {
    return this.configService.getConfig();
  }
} 