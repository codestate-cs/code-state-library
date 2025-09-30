import { Script, ScriptIndex, ScriptCollection, LifecycleEvent } from '../models/Script';
import { Result } from '../models/Result';
import { ExportOptions, ExportResult } from '../../use-cases/scripts/ExportScripts';
import { ImportOptions, ImportResult } from '../../use-cases/scripts/ImportScripts';

export interface IScriptService {
  // Script operations
  createScript(script: Script): Promise<Result<void>>;
  getScriptById(id: string): Promise<Result<Script>>;
  getScripts(options?: { rootPath?: string; lifecycle?: LifecycleEvent; ids?: string[] }): Promise<Result<Script[]>>;
  updateScript(id: string, script: Partial<Script>): Promise<Result<void>>;
  deleteScripts(ids: string[]): Promise<Result<void>>;
  
  // Import/Export operations
  exportScripts(options?: ExportOptions): Promise<Result<ExportResult>>;
  importScripts(filePath: string, options?: ImportOptions): Promise<Result<ImportResult>>;
}

export interface IScriptRepository {
  // Script operations
  createScript(script: Script): Promise<Result<void>>;
  getScriptById(id: string): Promise<Result<Script>>;
  getScripts(options?: { rootPath?: string; lifecycle?: LifecycleEvent; ids?: string[] }): Promise<Result<Script[]>>;
  updateScript(id: string, script: Partial<Script>): Promise<Result<void>>;
  deleteScripts(ids: string[]): Promise<Result<void>>;
} 