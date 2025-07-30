import { Result } from '../models/Result';
import { StorageError } from '../types/ErrorTypes';

export interface IStorageService {
  read(path: string): Promise<Result<string, StorageError>>;
  write(path: string, data: string): Promise<Result<void, StorageError>>;
  exists(path: string): Promise<Result<boolean, StorageError>>;
  delete(path: string): Promise<Result<void, StorageError>>;
} 