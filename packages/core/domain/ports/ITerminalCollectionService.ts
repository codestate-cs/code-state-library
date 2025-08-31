import { Result } from '../models/Result';
import { TerminalCollection, TerminalCollectionWithScripts } from '../models/TerminalCollection';
import { LifecycleEvent } from '../models/Script';

export interface ITerminalCollectionService {
  createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>>;
  getTerminalCollectionById(id: string): Promise<Result<TerminalCollection>>;
  getTerminalCollections(options?: { rootPath?: string; lifecycle?: LifecycleEvent; loadScripts?: boolean }): Promise<Result<TerminalCollection[] | TerminalCollectionWithScripts[]>>;
  updateTerminalCollection(id: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>>;
  deleteTerminalCollections(ids: string[]): Promise<Result<void>>;
  executeTerminalCollectionById(id: string): Promise<Result<void>>;
}
