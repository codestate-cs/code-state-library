import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class DeleteScript {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(name: string, rootPath: string): Promise<Result<void>> {
    return this.scriptService.deleteScript(name, rootPath);
  }
} 