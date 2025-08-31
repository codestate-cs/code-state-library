import { Session } from '../../domain/models/Session';
import { Script } from '../../domain/models/Script';
import { TerminalCollection } from '../../domain/models/TerminalCollection';
import { Result } from '../../domain/models/Result';
import { SessionFacade } from '../../services/session/SessionFacade';
import { ScriptFacade } from '../../services/scripts/ScriptFacade';
import { TerminalCollectionFacade } from '../../services/terminals/TerminalCollectionFacade';
import * as fs from 'fs/promises';

export interface ImportSessionOptions {
  conflictResolution?: 'skip' | 'overwrite' | 'rename';
  dryRun?: boolean;
  updatePaths?: boolean; // Whether to update project paths to current project
}

export interface ImportSessionResult {
  created: number;
  skipped: number;
  errors: string[];
  totalProcessed: number;
  scriptsCreated: number;
  scriptsSkipped: number;
  terminalCollectionsCreated: number;
  terminalCollectionsSkipped: number;
}

export interface ImportedSession {
  session: Session;
  bundledScripts?: Script[];
  bundledTerminalCollections?: TerminalCollection[];
  conflict?: {
    existingId: string;
    existingName: string;
    resolution: 'skip' | 'overwrite' | 'rename';
  };
}

export class ImportSessions {
  private sessionService: SessionFacade;
  private scriptService: ScriptFacade;
  private terminalCollectionService: TerminalCollectionFacade;

  constructor() {
    // Initialize our own services
    this.sessionService = new SessionFacade();
    this.scriptService = new ScriptFacade();
    this.terminalCollectionService = new TerminalCollectionFacade();
  }

  async execute(
    filePath: string,
    options: ImportSessionOptions = {}
  ): Promise<Result<ImportSessionResult>> {
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

      // Extract sessions array
      const sessions = this.extractSessions(parsedData);
      if (sessions.length === 0) {
        return {
          ok: false,
          error: new Error('No valid sessions found in the file')
        };
      }

      // Validate sessions
      const validationResult = this.validateSessions(sessions);
      if (!validationResult.ok) {
        return validationResult;
      }

      const results: ImportSessionResult = {
        created: 0,
        skipped: 0,
        errors: [],
        totalProcessed: sessions.length,
        scriptsCreated: 0,
        scriptsSkipped: 0,
        terminalCollectionsCreated: 0,
        terminalCollectionsSkipped: 0
      };

      // Process each session
      for (const sessionData of sessions) {
        try {
          const importResult = await this.processSession(sessionData, options);
          
          if (importResult.resolution === 'skip') {
            results.skipped++;
            results.scriptsSkipped += (sessionData.bundledScripts?.length || 0);
            results.terminalCollectionsSkipped += (sessionData.bundledTerminalCollections?.length || 0);
          } else if (importResult.resolution === 'overwrite') {
            // For overwrite, we'd need an updateSession method
            // For now, we'll skip and add to errors
            results.errors.push(`Overwrite not yet implemented for ${sessionData.session.name}`);
            results.skipped++;
            results.scriptsSkipped += (sessionData.bundledScripts?.length || 0);
            results.terminalCollectionsSkipped += (sessionData.bundledTerminalCollections?.length || 0);
          } else if (importResult.resolution === 'rename') {
            // Generate new name
            const newName = await this.generateUniqueSessionName(sessionData.session.name);
            
            if (!options.dryRun) {
              // Import dependencies first
              const dependencyResults = await this.importDependencies(sessionData, options);
              results.scriptsCreated += dependencyResults.scriptsCreated;
              results.scriptsSkipped += dependencyResults.scriptsSkipped;
              results.terminalCollectionsCreated += dependencyResults.terminalCollectionsCreated;
              results.terminalCollectionsSkipped += dependencyResults.terminalCollectionsSkipped;
              
              // Create session with new name
              const renamedSession = { 
                ...sessionData.session, 
                name: newName 
              };
              const createResult = await this.sessionService.saveSession(renamedSession);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create renamed session ${newName}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
              results.scriptsCreated += (sessionData.bundledScripts?.length || 0);
              results.terminalCollectionsCreated += (sessionData.bundledTerminalCollections?.length || 0);
            }
          } else {
            // No conflict, create normally
            if (!options.dryRun) {
              // Import dependencies first
              const dependencyResults = await this.importDependencies(sessionData, options);
              results.scriptsCreated += dependencyResults.scriptsCreated;
              results.scriptsSkipped += dependencyResults.scriptsSkipped;
              results.terminalCollectionsCreated += dependencyResults.terminalCollectionsCreated;
              results.terminalCollectionsSkipped += dependencyResults.terminalCollectionsSkipped;
              
              // Create session
              const createResult = await this.sessionService.saveSession(sessionData.session);
              if (createResult.ok) {
                results.created++;
              } else {
                results.errors.push(`Failed to create session ${sessionData.session.name}: ${createResult.error}`);
              }
            } else {
              results.created++; // Count as would-be created in dry run
              results.scriptsCreated += (sessionData.bundledScripts?.length || 0);
              results.terminalCollectionsCreated += (sessionData.bundledTerminalCollections?.length || 0);
            }
          }
        } catch (error) {
          results.errors.push(`Error processing ${sessionData.session.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private extractSessions(parsedData: any): any[] {
    // Handle different export formats
    if (Array.isArray(parsedData)) {
      return parsedData;
    } else if (parsedData.sessions && Array.isArray(parsedData.sessions)) {
      return parsedData.sessions;
    } else if (parsedData.entries && Array.isArray(parsedData.entries)) {
      // Handle index.json format
      return parsedData.entries.map((entry: any) => entry.session || entry);
    }
    
    return [];
  }

  private validateSessions(sessions: any[]): Result<void> {
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      
      if (!session.name || typeof session.name !== 'string') {
        return {
          ok: false,
          error: new Error(`Session at index ${i} is missing or has invalid name`)
        };
      }

      if (!session.projectRoot || typeof session.projectRoot !== 'string') {
        return {
          ok: false,
          error: new Error(`Session '${session.name}' is missing or has invalid projectRoot`)
        };
      }

      if (!session.files || !Array.isArray(session.files)) {
        return {
          ok: false,
          error: new Error(`Session '${session.name}' is missing or has invalid files`)
        };
      }

      if (!session.git || typeof session.git !== 'object') {
        return {
          ok: false,
          error: new Error(`Session '${session.name}' is missing or has invalid git state`)
        };
      }

      // Validate bundled scripts if present
      if (session.bundledScripts && Array.isArray(session.bundledScripts)) {
        for (let j = 0; j < session.bundledScripts.length; j++) {
          const script = session.bundledScripts[j];
          if (!script.name || typeof script.name !== 'string') {
            return {
              ok: false,
              error: new Error(`Script at index ${j} in session '${session.name}' is missing or has invalid name`)
            };
          }
          if (!script.commands || !Array.isArray(script.commands)) {
            return {
              ok: false,
              error: new Error(`Script '${script.name}' in session '${session.name}' is missing or has invalid commands`)
            };
          }
        }
      }

      // Validate bundled terminal collections if present
      if (session.bundledTerminalCollections && Array.isArray(session.bundledTerminalCollections)) {
        for (let j = 0; j < session.bundledTerminalCollections.length; j++) {
          const tc = session.bundledTerminalCollections[j];
          if (!tc.name || typeof tc.name !== 'string') {
            return {
              ok: false,
              error: new Error(`Terminal collection at index ${j} in session '${session.name}' is missing or has invalid name`)
            };
          }
          if (!tc.scripts || !Array.isArray(tc.scripts)) {
            return {
              ok: false,
              error: new Error(`Terminal collection '${tc.name}' in session '${session.name}' is missing or has invalid scripts`)
            };
          }
        }
      }
    }

    return { ok: true, value: undefined };
  }

  private async processSession(
    sessionData: any,
    options: ImportSessionOptions
  ): Promise<{ resolution: 'skip' | 'overwrite' | 'rename' | 'no-conflict' }> {
    // Check for conflicts
    const existingSessions = await this.sessionService.listSessions({
      search: sessionData.session.name
    });

    if (!existingSessions.ok) {
      // If we can't check for conflicts, assume no conflict
      return { resolution: 'no-conflict' };
    }

    const conflict = existingSessions.value.find(
      (s: any) => s.name === sessionData.session.name
    );

    if (!conflict) {
      return { resolution: 'no-conflict' }; // No conflict
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

  private async generateUniqueSessionName(baseName: string): Promise<string> {
    const existingSessions = await this.sessionService.listSessions();
    if (!existingSessions.ok) {
      return `${baseName}-imported`;
    }

    let counter = 1;
    let newName = `${baseName}-imported`;
    
    while (existingSessions.value.some((s: any) => s.name === newName)) {
      newName = `${baseName}-imported-${counter}`;
      counter++;
    }

    return newName;
  }

  private async importDependencies(
    sessionData: any, 
    options: ImportSessionOptions
  ): Promise<{ 
    scriptsCreated: number; 
    scriptsSkipped: number;
    terminalCollectionsCreated: number;
    terminalCollectionsSkipped: number;
  }> {
    let scriptsCreated = 0;
    let scriptsSkipped = 0;
    let terminalCollectionsCreated = 0;
    let terminalCollectionsSkipped = 0;

    // Import scripts
    if (sessionData.bundledScripts) {
      for (const script of sessionData.bundledScripts) {
        try {
          // Check for script conflicts
          const existingScripts = await this.scriptService.getScripts({
            rootPath: script.rootPath
          });

          if (!existingScripts.ok) {
            scriptsSkipped++;
            continue;
          }

          const conflict = existingScripts.value.find(
            (s: any) => s.name === script.name && s.rootPath === script.rootPath
          );

          if (conflict) {
            // Script already exists, skip
            scriptsSkipped++;
            continue;
          }

          // No conflict, create script
          if (!options.dryRun) {
            const createResult = await this.scriptService.createScript(script);
            if (createResult.ok) {
              scriptsCreated++;
            } else {
              scriptsSkipped++;
            }
          } else {
            scriptsCreated++; // Count as would-be created in dry run
          }
        } catch (error) {
          scriptsSkipped++;
        }
      }
    }

    // Import terminal collections
    if (sessionData.bundledTerminalCollections) {
      for (const tc of sessionData.bundledTerminalCollections) {
        try {
          // Check for terminal collection conflicts
          const existingTCs = await this.terminalCollectionService.getTerminalCollections({
            rootPath: tc.rootPath
          });

          if (!existingTCs.ok) {
            terminalCollectionsSkipped++;
            continue;
          }

          const conflict = existingTCs.value.find(
            (existingTc: any) => existingTc.name === tc.name && existingTc.rootPath === tc.rootPath
          );

          if (conflict) {
            // Terminal collection already exists, skip
            terminalCollectionsSkipped++;
            continue;
          }

          // No conflict, create terminal collection
          if (!options.dryRun) {
            const createResult = await this.terminalCollectionService.createTerminalCollection(tc);
            if (createResult.ok) {
              terminalCollectionsCreated++;
            } else {
              terminalCollectionsSkipped++;
            }
          } else {
            terminalCollectionsCreated++; // Count as would-be created in dry run
          }
        } catch (error) {
          terminalCollectionsSkipped++;
        }
      }
    }

    return { scriptsCreated, scriptsSkipped, terminalCollectionsCreated, terminalCollectionsSkipped };
  }
} 