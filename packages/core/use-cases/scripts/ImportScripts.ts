import { IScriptService } from '@codestate/core/domain/ports/IScriptService';
import { Script } from '@codestate/core/domain/models/Script';
import { Result } from '@codestate/core/domain/models/Result';
import { ScriptFacade } from '@codestate/core/services/scripts/ScriptFacade';
import { validateScript } from '@codestate/core/domain/schemas/SchemaRegistry';

export class ImportScripts {
  private scriptService: IScriptService;
  
  constructor(scriptService?: IScriptService) {
    this.scriptService = scriptService || new ScriptFacade();
  }
  
  async execute(json: string): Promise<Result<void>> {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) {
        return { ok: false, error: new Error('Invalid format: expected array of scripts') };
      }
      
      const scripts: Script[] = [];
      for (const item of parsed) {
        try {
          const validatedScript = validateScript(item);
          scripts.push(validatedScript);
        } catch (validationError) {
          return { ok: false, error: new Error(`Invalid script format: ${validationError}`) };
        }
      }
      
      return this.scriptService.createScripts(scripts);
    } catch (parseError) {
      return { ok: false, error: new Error(`Invalid JSON: ${parseError}`) };
    }
  }
} 