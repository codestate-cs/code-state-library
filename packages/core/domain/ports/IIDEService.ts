import { IDE, FileOpenRequest } from '../models/IDE';
import { Result } from '../models/Result';

export interface IIDEService {
  openIDE(ideName: string, projectRoot: string): Promise<Result<boolean>>;
  openFiles(request: FileOpenRequest): Promise<Result<boolean>>;
  getAvailableIDEs(): Promise<Result<IDE[]>>;
  isIDEInstalled(ideName: string): Promise<Result<boolean>>;
} 