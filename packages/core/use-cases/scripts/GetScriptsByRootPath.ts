import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Script } from '@codestate/core/domain/models/Script';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class GetScriptsByRootPath {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(rootPath: string): Promise<Result<Script[]>> {
    return this.scriptService.getScriptsByRootPath(rootPath);
  }
} 