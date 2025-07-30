import { IConfigService, IConfigRepository } from '@codestate/core/domain/ports/IConfigService';
import { Config } from '@codestate/core/domain/models/Config';
import { Result } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';

export class ConfigService implements IConfigService {
  constructor(
    private repository: IConfigRepository,
    private logger: ILoggerService
  ) {}

  async getConfig(): Promise<Result<Config>> {
    this.logger.debug('ConfigService.getConfig called');
    const result = await this.repository.load();
    if (!result.ok) {
      this.logger.error('Failed to get config', { error: result.error });
    } else {
      this.logger.log('Config loaded', {});
    }
    return result;
  }

  async setConfig(config: Config): Promise<Result<void>> {
    this.logger.debug('ConfigService.setConfig called');
    const result = await this.repository.save(config);
    if (!result.ok) {
      this.logger.error('Failed to save config', { error: result.error });
    } else {
      this.logger.log('Config saved', {});
    }
    return result;
  }

  async updateConfig(partial: Partial<Config>): Promise<Result<Config>> {
    this.logger.debug('ConfigService.updateConfig called', { partial });
    const current = await this.repository.load();
    if (!current.ok) {
      this.logger.error('Failed to load config for update', { error: current.error });
      return current;
    }
    const merged = { ...current.value, ...partial };
    // TODO: Add validation/migration logic if needed
    const saveResult = await this.repository.save(merged);
    if (!saveResult.ok) {
      this.logger.error('Failed to save updated config', { error: saveResult.error });
      return { ok: false, error: saveResult.error };
    }
    this.logger.log('Config updated', {});
    return { ok: true, value: merged };
  }
} 