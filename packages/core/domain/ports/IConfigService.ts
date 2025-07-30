import { Config } from '../models/Config';
import { Result } from '../models/Result';

export interface IConfigService {
  getConfig(): Promise<Result<Config>>;
  setConfig(config: Config): Promise<Result<void>>;
  updateConfig(partial: Partial<Config>): Promise<Result<Config>>;
}

export interface IConfigRepository {
  load(): Promise<Result<Config>>;
  save(config: Config): Promise<Result<void>>;
} 