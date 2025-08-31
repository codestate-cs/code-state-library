import { TerminalCollection, TerminalCollectionWithScripts } from '../../domain/models/TerminalCollection';
import { Script } from '../../domain/models/Script';
import { Result } from '../../domain/models/Result';
import { TerminalCollectionFacade } from '../../services/terminals/TerminalCollectionFacade';
import { ScriptFacade } from '../../services/scripts/ScriptFacade';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ImportTerminalCollectionOptions {
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
  dryRun?: boolean;
  updatePaths?: boolean; // Whether to update script paths to current project
}

export interface ImportTerminalCollectionResult {
  created: number;
  skipped: number;
  errors: string[];
  totalProcessed: number;
  scriptsCreated: number;
  scriptsSkipped: number;
}

export interface ImportedTerminalCollection {
  terminalCollection: TerminalCollection;
  scripts: Script[];
  conflict?: {
    existingId: string;
    existingName: string;
    resolution: 'skip' | 'overwrite' | 'rename';
  };
}

export class ImportTerminalCollections {
  private terminalCollectionService: TerminalCollectionFacade;
  private scriptService: ScriptFacade;

  constructor() {
    // Initialize our own services
    this.terminalCollectionService = new TerminalCollectionFacade();
    this.scriptService = new ScriptFacade();
  }

  async execute(
    filePath: string,
    options: ImportTerminalCollectionOptions = {}
  ): Promise<Result<ImportTerminalCollectionResult>> {
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

      // Extract terminal collections array
      const terminalCollections = this.extractTerminalCollections(parsedData);
      if (terminalCollections.length === 0) {
        return {
          ok: false,
          error: new Error('No valid terminal collections found in the file')
        };
      }

      // Validate terminal collections
      const validationResult = this.validateTerminalCollections(terminalCollections);
      if (!validationResult.ok) {
        return validationResult;
      }

      const results: ImportTerminalCollectionResult = {
        created: 0,
        skipped: 0,
        errors: [],
        totalProcessed: terminalCollections.length,
        scriptsCreated: 0,
        scriptsSkipped: 0
      };

      // Process each terminal collection
      for (const terminalCollectionData of terminalCollections) {
        try {
          const importResult = await this.processTerminalCollection(terminalCollectionData, options);
          
                  if (importResult.resolution === 'skip') {
          results.skipped++;
          results.scriptsSkipped += terminalCollectionData.scripts.length;
        } else if (importResult.resolution === 'no-conflict') {
          // No conflict, create normally
          if (!options.dryRun) {
            // Import scripts first
            const scriptResults = await this.importScripts(terminalCollectionData.scripts, options);
            results.scriptsCreated += scriptResults.created;
            results.scriptsSkipped += scriptResults.skipped;
            
            // Create terminal collection
            const createResult = await this.terminalCollectionService.createTerminalCollection(terminalCollectionData);
            if (createResult.ok) {
              results.created++;
            } else {
              results.errors.push(`Failed to create terminal collection ${terminalCollectionData.name}: ${createResult.error}`);
            }
          } else {
            results.created++; // Count as would-be created in dry run
            results.scriptsCreated += terminalCollectionData.scripts.length;
          }
        } else if (importResult.resolution === 'overwrite') {
            // For overwrite, we'd need an updateTerminalCollection method
            // For now, we'll skip and add to errors
            results.errors.push(`Overwrite not yet implemented for ${terminalCollectionData.name}`);
            results.skipped++;
            results.scriptsSkipped += terminalCollectionData.scripts.length;
          } else if (importResult.resolution === 'rename') {
            // Generate new name
            const newName = await this.generateUniqueTerminalCollectionName(
              terminalCollectionData.name, 
              terminalCollectionData.rootPath
            );
            
            if (!options.dryRun) {
              // Import scripts first
              const scriptResults = await this.importScripts(terminalCollectionData.scripts, options);
              results.scriptsCreated += scriptResults.created;
              results.scriptsSkipped += scriptResults.skipped;
              
              // Create terminal collection with new name
              const renamedTerminalCollection = { 
                ...terminalCollectionData, 
                name: newName 
              };
              const createResult = await this.terminalCollectionService.createTerminalCollection(renamedTerminalCollection);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create renamed terminal collection ${newName}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
              results.scriptsCreated += terminalCollectionData.scripts.length;
            }
          } else {
            // No conflict, create normally
            if (!options.dryRun) {
              // Import scripts first
              const scriptResults = await this.importScripts(terminalCollectionData.scripts, options);
              results.scriptsCreated += scriptResults.created;
              results.scriptsSkipped += scriptResults.skipped;
              
              // Create terminal collection
              const createResult = await this.terminalCollectionService.createTerminalCollection(terminalCollectionData);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create terminal collection ${terminalCollectionData.name}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
              results.scriptsCreated += terminalCollectionData.scripts.length;
            }
          }
        } catch (error) {
          results.errors.push(`Error processing ${terminalCollectionData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private extractTerminalCollections(parsedData: any): TerminalCollectionWithScripts[] {
    // Handle different export formats
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else if (parsedData.terminalCollections && Array.isArray(parsedData.terminalCollections)) {
      return parsedData.terminalCollections;
    } else if (parsedData.entries && Array.isArray(parsedData.entries)) {
      // Handle index.json format
      return parsedData.entries.map((entry: any) => entry.terminalCollection || entry);
    }
    
    return [];
  }

  private validateTerminalCollections(terminalCollections: any[]): Result<void> {
    for (let i = 0; i < terminalCollections.length; i++) {
      const terminalCollection = terminalCollections[i];
      
      if (!terminalCollection.name || typeof terminalCollection.name !== 'string') {
        return {
          ok: false,
          error: new Error(`Terminal collection at index ${i} is missing or has invalid name`)
        };
      }

      if (!terminalCollection.rootPath || typeof terminalCollection.rootPath !== 'string') {
        return {
          ok: false,
          error: new Error(`Terminal collection '${terminalCollection.name}' is missing or has invalid rootPath`)
        };
      }

      if (!terminalCollection.lifecycle || !Array.isArray(terminalCollection.lifecycle)) {
        return {
          ok: false,
          error: new Error(`Terminal collection '${terminalCollection.name}' is missing or has invalid lifecycle`)
        };
      }

      if (!terminalCollection.scripts || !Array.isArray(terminalCollection.scripts)) {
        return {
          ok: false,
          error: new Error(`Terminal collection '${terminalCollection.name}' is missing or has invalid scripts`)
        };
      }

      // Validate scripts
      for (let j = 0; j < terminalCollection.scripts.length; j++) {
        const script = terminalCollection.scripts[j];
        if (!script.name || typeof script.name !== 'string') {
          return {
            ok: false,
            error: new Error(`Script at index ${j} in terminal collection '${terminalCollection.name}' is missing or has invalid name`)
          };
        }

        if (!script.rootPath || typeof script.rootPath !== 'string') {
          return {
            ok: false,
            error: new Error(`Script '${script.name}' in terminal collection '${terminalCollection.name}' is missing or has invalid rootPath`)
          };
        }

        if (!script.commands || !Array.isArray(script.commands)) {
          return {
            ok: false,
            error: new Error(`Script '${script.name}' in terminal collection '${terminalCollection.name}' is missing or has invalid commands`)
          };
        }

        // Validate commands
        for (let k = 0; k < script.commands.length; k++) {
          const command = script.commands[k];
          if (!command.command || typeof command.command !== 'string') {
            return {
              ok: false,
              error: new Error(`Script '${script.name}' command at index ${k} in terminal collection '${terminalCollection.name}' is missing or has invalid command`)
            };
          }
        }
      }
    }

    return { ok: true, value: undefined };
  }

  private async processTerminalCollection(
    terminalCollectionData: TerminalCollectionWithScripts,
    options: ImportTerminalCollectionOptions
  ): Promise<{ resolution: 'skip' | 'overwrite' | 'rename' | 'no-conflict' }> {
    // Check for conflicts
    const existingTerminalCollections = await this.terminalCollectionService.getTerminalCollections({
      rootPath: terminalCollectionData.rootPath
    });

    if (!existingTerminalCollections.ok) {
      // If we can't check for conflicts, assume no conflict
      return { resolution: 'skip' };
    }

    const conflict = existingTerminalCollections.value.find(
      (tc: any) => tc.name === terminalCollectionData.name && 
                   tc.rootPath === terminalCollectionData.rootPath
    );

    if (!conflict) {
      return { resolution: 'no-conflict' }; // No conflict - can proceed with import
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

  private async generateUniqueTerminalCollectionName(baseName: string, rootPath: string): Promise<string> {
    const existingTerminalCollections = await this.terminalCollectionService.getTerminalCollections({ rootPath });
    if (!existingTerminalCollections.ok) {
      return `${baseName}-imported`;
    }

    let counter = 1;
    let newName = `${baseName}-imported`;
    
    while (existingTerminalCollections.value.some((tc: any) => tc.name === newName)) {
      newName = `${baseName}-imported-${counter}`;
      counter++;
    }

    return newName;
  }

  private async importScripts(scripts: Script[], options: ImportTerminalCollectionOptions): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const script of scripts) {
      try {
        // Check for script conflicts
        const existingScripts = await this.scriptService.getScripts({
          rootPath: script.rootPath
        });

        if (!existingScripts.ok) {
          skipped++;
          continue;
        }

        const conflict = existingScripts.value.find(
          (s: any) => s.name === script.name && s.rootPath === script.rootPath
        );

        if (conflict) {
          // Script already exists, skip
          skipped++;
          continue;
        }

        // No conflict, create script
        if (!options.dryRun) {
          const createResult = await this.scriptService.createScript(script);
          if (createResult.ok) {
            created++;
          } else {
            skipped++;
          }
        } else {
          created++; // Count as would-be created in dry run
        }
      } catch (error) {
        skipped++;
      }
    }

    return { created, skipped };
  }
} 