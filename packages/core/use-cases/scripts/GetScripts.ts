import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Script, LifecycleEvent } from '@codestate/core/domain/models/Script';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class GetScripts {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(options?: { rootPath?: string; lifecycle?: LifecycleEvent; ids?: string[] }): Promise<Result<Script[]>> {
    return this.scriptService.getScripts(options);
  }
} 