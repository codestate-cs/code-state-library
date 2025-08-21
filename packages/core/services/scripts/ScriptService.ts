import { IScriptService, IScriptRepository } from '../../domain/ports/IScriptService';
import { Script, ScriptIndex } from '../../domain/models/Script';
import { Result, isSuccess, isFailure } from '../../domain/models/Result';
import { ILoggerService } from '../../domain/ports/ILoggerService';

export class ScriptService implements IScriptService {
  constructor(
    private repository: IScriptRepository,
    private logger: ILoggerService
  ) {}

  async createScript(script: Script): Promise<Result<void>> {
    this.logger.debug('ScriptService.createScript called', { script });
    const result = await this.repository.createScript(script);
    if (isFailure(result)) {
      this.logger.error('Failed to create script', { error: result.error, script });
    } else {
      this.logger.log('Script created successfully', { script });
    }
    return result;
  }

  async createScripts(scripts: Script[]): Promise<Result<void>> {
    this.logger.debug('ScriptService.createScripts called', { count: scripts.length });
    const result = await this.repository.createScripts(scripts);
    if (isFailure(result)) {
      this.logger.error('Failed to create scripts', { error: result.error, count: scripts.length });
    } else {
      this.logger.log('Scripts created successfully', { count: scripts.length });
    }
    return result;
  }

  async getScriptsByRootPath(rootPath: string): Promise<Result<Script[]>> {
    this.logger.debug('ScriptService.getScriptsByRootPath called', { rootPath });
    const result = await this.repository.getScriptsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to get scripts by root path', { error: result.error, rootPath });
    } else {
      this.logger.log('Scripts retrieved by root path', { rootPath, count: result.value.length });
    }
    return result;
  }

  async getAllScripts(): Promise<Result<Script[]>> {
    this.logger.debug('ScriptService.getAllScripts called');
    const result = await this.repository.getAllScripts();
    if (isFailure(result)) {
      this.logger.error('Failed to get all scripts', { error: result.error });
    } else {
      this.logger.log('All scripts retrieved', { count: result.value.length });
    }
    return result;
  }

  async getScriptById(id: string): Promise<Result<Script>> {
    this.logger.debug('ScriptService.getScriptById called', { id });
    const result = await this.repository.getScriptById(id);
    if (isFailure(result)) {
      this.logger.error('Failed to get script by ID', { error: result.error, id });
    } else {
      this.logger.log('Script retrieved by ID', { id, name: result.value.name });
    }
    return result;
  }

  async updateScript(name: string, rootPath: string, scriptUpdate: Partial<Script>): Promise<Result<void>> {
    this.logger.debug('ScriptService.updateScript called', { name, rootPath, scriptUpdate });
    const result = await this.repository.updateScript(name, rootPath, scriptUpdate);
    if (isFailure(result)) {
      this.logger.error('Failed to update script', { error: result.error, name, rootPath });
    } else {
      this.logger.log('Script updated successfully', { name, rootPath });
    }
    return result;
  }

  async updateScripts(updates: Array<{ name: string; rootPath: string; script: Partial<Script> }>): Promise<Result<void>> {
    this.logger.debug('ScriptService.updateScripts called', { count: updates.length });
    const result = await this.repository.updateScripts(updates);
    if (isFailure(result)) {
      this.logger.error('Failed to update scripts', { error: result.error, count: updates.length });
    } else {
      this.logger.log('Scripts updated successfully', { count: updates.length });
    }
    return result;
  }

  async deleteScript(name: string, rootPath: string): Promise<Result<void>> {
    this.logger.debug('ScriptService.deleteScript called', { name, rootPath });
    const result = await this.repository.deleteScript(name, rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to delete script', { error: result.error, name, rootPath });
    } else {
      this.logger.log('Script deleted successfully', { name, rootPath });
    }
    return result;
  }

  async deleteScripts(scripts: Array<{ name: string; rootPath: string }>): Promise<Result<void>> {
    this.logger.debug('ScriptService.deleteScripts called', { count: scripts.length });
    const result = await this.repository.deleteScripts(scripts);
    if (isFailure(result)) {
      this.logger.error('Failed to delete scripts', { error: result.error, count: scripts.length });
    } else {
      this.logger.log('Scripts deleted successfully', { count: scripts.length });
    }
    return result;
  }

  async deleteScriptsByRootPath(rootPath: string): Promise<Result<void>> {
    this.logger.debug('ScriptService.deleteScriptsByRootPath called', { rootPath });
    const result = await this.repository.deleteScriptsByRootPath(rootPath);
    if (isFailure(result)) {
      this.logger.error('Failed to delete scripts by root path', { error: result.error, rootPath });
    } else {
      this.logger.log('Scripts deleted by root path successfully', { rootPath });
    }
    return result;
  }

  async getScriptIndex(): Promise<Result<ScriptIndex>> {
    this.logger.debug('ScriptService.getScriptIndex called');
    const result = await this.repository.loadScriptIndex();
    if (isFailure(result)) {
      this.logger.error('Failed to get script index', { error: result.error });
    } else {
      this.logger.log('Script index retrieved', { entryCount: result.value.entries.length });
    }
    return result;
  }

  async updateScriptIndex(index: ScriptIndex): Promise<Result<void>> {
    this.logger.debug('ScriptService.updateScriptIndex called');
    const result = await this.repository.saveScriptIndex(index);
    if (isFailure(result)) {
      this.logger.error('Failed to update script index', { error: result.error });
    } else {
      this.logger.log('Script index updated successfully');
    }
    return result;
  }
} 