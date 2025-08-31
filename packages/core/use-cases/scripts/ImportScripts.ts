import { Script } from '../../domain/models/Script';
import { Result } from '../../domain/models/Result';
import { ScriptFacade } from '../../services/scripts/ScriptFacade';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ImportOptions {
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
  dryRun?: boolean;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
  totalProcessed: number;
}

export interface ImportedScript {
  script: Script;
  conflict?: {
    existingId: string;
    existingName: string;
    resolution: 'skip' | 'overwrite' | 'rename';
  };
}

export class ImportScripts {
  private scriptService: ScriptFacade;

  constructor() {
    // Initialize our own script service
    this.scriptService = new ScriptFacade();
  }

  async execute(
    filePath: string,
    options: ImportOptions = {}
  ): Promise<Result<ImportResult>> {
    try {
      // Read and parse JSON file
      const fileContent = await fs.readFile(filePath, 'utf8');
      let parsedData: any;

      try {
        parsedData = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          ok: false,
          error: new Error(`Invalid JSON file: ${parseError instanceof Error ? parseError.message : 'Parse error'}`)
        };
      }

      // Extract scripts array
      const scripts = this.extractScripts(parsedData);
      if (scripts.length === 0) {
        return {
          ok: false,
          error: new Error('No valid scripts found in the file')
        };
      }

      // Validate scripts
      const validationResult = this.validateScripts(scripts);
      if (!validationResult.ok) {
        return validationResult;
      }

      const results: ImportResult = {
        created: 0,
        skipped: 0,
        errors: [],
        totalProcessed: scripts.length
      };

      // Process each script
      for (const script of scripts) {
        try {
          const importResult = await this.processScript(script, options);
          
          if (importResult.resolution === 'skip') {
            results.skipped++;
          } else if (importResult.resolution === 'overwrite') {
            // For overwrite, we'd need an updateScript method that takes name+rootPath
            // For now, we'll skip and add to errors
            results.errors.push(`Overwrite not yet implemented for ${script.name}`);
            results.skipped++;
          } else if (importResult.resolution === 'rename') {
            // Generate new name
            const newName = await this.generateUniqueName(script.name, script.rootPath);
            const renamedScript = { ...script, name: newName };
            
            if (!options.dryRun) {
              const createResult = await this.scriptService.createScript(renamedScript);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create renamed script ${newName}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
            }
          } else {
            // No conflict, create normally
            if (!options.dryRun) {
              const createResult = await this.scriptService.createScript(script);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create script ${script.name}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
            }
          }
        } catch (error) {
          results.errors.push(`Error processing ${script.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { ok: true, value: results };

    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Import failed')
      };
    }
  }

  private extractScripts(parsedData: any): Script[] {
    // Handle different export formats
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else if (parsedData.scripts && Array.isArray(parsedData.scripts)) {
      return parsedData.scripts;
    } else if (parsedData.entries && Array.isArray(parsedData.entries)) {
      // Handle index.json format
      return parsedData.entries.map((entry: any) => entry.script || entry);
    }
    
    return [];
  }

  private validateScripts(scripts: any[]): Result<void> {
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      
      if (!script.name || typeof script.name !== 'string') {
        return {
          ok: false,
          error: new Error(`Script at index ${i} is missing or has invalid name`)
        };
      }

      if (!script.rootPath || typeof script.rootPath !== 'string') {
        return {
          ok: false,
          error: new Error(`Script '${script.name}' is missing or has invalid rootPath`)
        };
      }

      if (!script.commands || !Array.isArray(script.commands)) {
        return {
          ok: false,
          error: new Error(`Script '${script.name}' is missing or has invalid commands`)
        };
      }

      // Validate commands
      for (let j = 0; j < script.commands.length; j++) {
        const command = script.commands[j];
        if (!command.command || typeof command.command !== 'string') {
          return {
            ok: false,
            error: new Error(`Script '${script.name}' command at index ${j} is missing or has invalid command`)
          };
        }
      }
    }

    return { ok: true, value: undefined };
  }

  private async processScript(
    script: Script,
    options: ImportOptions
  ): Promise<{ resolution: 'skip' | 'overwrite' | 'rename' }> {
    // Check for conflicts
    const existingScripts = await this.scriptService.getScripts({
      rootPath: script.rootPath
    });

    if (!existingScripts.ok) {
      // If we can't check for conflicts, assume no conflict
      return { resolution: 'skip' };
    }

    const conflict = existingScripts.value.find(
      s => s.name === script.name && s.rootPath === script.rootPath
    );

    if (!conflict) {
      return { resolution: 'skip' }; // No conflict
    }

    // Handle conflict based on strategy
    switch (options.conflictResolution) {
      case 'overwrite':
        return { resolution: 'overwrite' };
      case 'rename':
        return { resolution: 'rename' };
      case 'skip':
      default:
        return { resolution: 'skip' };
    }
  }

  private async generateUniqueName(baseName: string, rootPath: string): Promise<string> {
    const existingScripts = await this.scriptService.getScripts({ rootPath });
    if (!existingScripts.ok) {
      return `${baseName}-imported`;
    }

    let counter = 1;
    let newName = `${baseName}-imported`;
    
    while (existingScripts.value.some(s => s.name === newName)) {
      newName = `${baseName}-imported-${counter}`;
      counter++;
    }

    return newName;
  }
} 