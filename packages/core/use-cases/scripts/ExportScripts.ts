import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Result, isFailure } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';

export class ExportScripts {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(): Promise<Result<string>> {
    const result = await this.scriptService.getAllScripts();
    if (isFailure(result)) return { ok: false, error: result.error };
    return { ok: true, value: JSON.stringify(result.value, null, 2) };
  }
} 