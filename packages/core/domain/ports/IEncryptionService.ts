import { Result } from '../models/Result';
import { EncryptionError } from '../types/ErrorTypes';

export interface IEncryptionService {
  encrypt(data: string, key: string): Promise<Result<string, EncryptionError>>;
  decrypt(data: string, key: string): Promise<Result<string, EncryptionError>>;
} 