import { Script, ScriptIndex, ScriptCollection } from '../models/Script';
import { Result } from '../models/Result';

export interface IScriptService {
  // Script operations
  createScript(script: Script): Promise<Result<void>>;
  createScripts(scripts: Script[]): Promise<Result<void>>;
  getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>>;
  getAllScripts(): Promise<Result<Script[]>>;
  updateScript(name: string, rootPath: string, script: Partial<Script>): Promise<Result<void>>;
  updateScripts(updates: Array<{ name: string; rootPath: string; script: Partial<Script> }>): Promise<Result<void>>;
  deleteScript(name: string, rootPath: string): Promise<Result<void>>;
  deleteScripts(scripts: Array<{ name: string; rootPath: string }>): Promise<Result<void>>;
  deleteScriptsByRootPath(rootPath: string): Promise<Result<void>>;
  
  // Index operations
  getScriptIndex(): Promise<Result<ScriptIndex>>;
  updateScriptIndex(index: ScriptIndex): Promise<Result<void>>;
}

export interface IScriptRepository {
  // Script operations
  createScript(script: Script): Promise<Result<void>>;
  createScripts(scripts: Script[]): Promise<Result<void>>;
  getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>>;
  getAllScripts(): Promise<Result<Script[]>>;
  updateScript(name: string, rootPath: string, script: Partial<Script>): Promise<Result<void>>;
  updateScripts(updates: Array<{ name: string; rootPath: string; script: Partial<Script> }>): Promise<Result<void>>;
  deleteScript(name: string, rootPath: string): Promise<Result<void>>;
  deleteScripts(scripts: Array<{ name: string; rootPath: string }>): Promise<Result<void>>;
  deleteScriptsByRootPath(rootPath: string): Promise<Result<void>>;
  
  // Index operations
  loadScriptIndex(): Promise<Result<ScriptIndex>>;
  saveScriptIndex(index: ScriptIndex): Promise<Result<void>>;
} 