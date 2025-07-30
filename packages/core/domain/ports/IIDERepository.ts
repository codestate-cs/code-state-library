import { IDE } from '../models/IDE';
import { Result } from '../models/Result';

export interface IIDERepository {
  getIDEDefinitions(): Promise<Result<IDE[]>>;
  saveIDEDefinitions(ides: IDE[]): Promise<Result<void>>;
} 