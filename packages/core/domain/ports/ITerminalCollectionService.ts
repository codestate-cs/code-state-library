import { Result } from '../models/Result';
import { TerminalCollection, TerminalCollectionWithScripts } from '../models/TerminalCollection';
import { LifecycleEvent } from '../models/Script';

export interface ITerminalCollectionService {
  createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>>;
  getTerminalCollection(name: string, rootPath?: string): Promise<Result<TerminalCollection>>;
  getTerminalCollectionWithScripts(name: string, rootPath?: string): Promise<Result<TerminalCollectionWithScripts>>;
  getAllTerminalCollections(): Promise<Result<TerminalCollection[]>>;
  getAllTerminalCollectionsWithScripts(): Promise<Result<TerminalCollectionWithScripts[]>>;
  getTerminalCollectionsByRootPath(rootPath: string): Promise<Result<TerminalCollection[]>>;
  getTerminalCollectionsByRootPathWithScripts(rootPath: string): Promise<Result<TerminalCollectionWithScripts[]>>;
  getTerminalCollectionsByLifecycle(lifecycle: LifecycleEvent, rootPath: string): Promise<Result<TerminalCollection[]>>;
  updateTerminalCollection(name: string, rootPath: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>>;
  deleteTerminalCollection(name: string, rootPath: string): Promise<Result<void>>;
  deleteTerminalCollectionsByRootPath(rootPath: string): Promise<Result<void>>;
  executeTerminalCollection(name: string, rootPath?: string): Promise<Result<void>>;
}
