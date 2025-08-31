import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Script } from '@codestate/core/domain/models/Script';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class UpdateScript {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(id: string, scriptUpdate: Partial<Script>): Promise<Result<void>> {
    return this.scriptService.updateScript(id, scriptUpdate);
  }
} 