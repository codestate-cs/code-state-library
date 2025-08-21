import { Result } from '../models/Result';
import { TerminalCollection, TerminalCollectionIndex } from '../models/TerminalCollection';
import { LifecycleEvent } from '../models/Script';

export interface ITerminalCollectionRepository {
  createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>>;
  getTerminalCollection(name: string, rootPath?: string): Promise<Result<TerminalCollection>>;
  getAllTerminalCollections(): Promise<Result<TerminalCollection[]>>;
  getTerminalCollectionById(id: string): Promise<Result<TerminalCollection>>;
  getTerminalCollectionsByRootPath(rootPath: string): Promise<Result<TerminalCollection[]>>;
  getTerminalCollectionsByLifecycle(lifecycle: LifecycleEvent, rootPath: string): Promise<Result<TerminalCollection[]>>;
  updateTerminalCollection(name: string, rootPath: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>>;
  deleteTerminalCollection(name: string, rootPath: string): Promise<Result<void>>;
  deleteTerminalCollectionsByRootPath(rootPath: string): Promise<Result<void>>;
  getTerminalCollectionIndex(): Promise<Result<TerminalCollectionIndex>>;
  updateTerminalCollectionIndex(index: TerminalCollectionIndex): Promise<Result<void>>;
}
