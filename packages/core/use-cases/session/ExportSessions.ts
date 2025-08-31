import { Session } from '../../domain/models/Session';
import { Result } from '../../domain/models/Result';
import { SessionFacade } from '../../services/session/SessionFacade';
import { ScriptFacade } from '../../services/scripts/ScriptFacade';
import { TerminalCollectionFacade } from '../../services/terminals/TerminalCollectionFacade';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ExportSessionOptions {
  // Filter options
  tags?: string[];
  search?: string;
  sessionIds?: string[];  // Specific session IDs to export
  
  // Export options
  filename?: string;
  includeMetadata?: boolean;
  
  // Selection mode
  selectionMode?: 'filter' | 'ids' | 'interactive';  // How to select sessions
}

export interface ExportSessionResult {
  filePath: string;
  sessionCount: number;
  scriptCount: number;
  terminalCollectionCount: number;
  exportedAt: string;
  selectedSessions: SessionWithDependencies[];  // Which sessions were actually exported
  filters: {
    tags?: string[];
    search?: string;
    sessionIds?: string[];
  };
}

export interface SessionWithDependencies extends Session {
  bundledScripts?: any[];  // Full script objects
  bundledTerminalCollections?: any[];  // Full terminal collection objects
}

export class ExportSessions {
  private sessionService: SessionFacade;
  private scriptService: ScriptFacade;
  private terminalCollectionService: TerminalCollectionFacade;

  constructor() {
    // Initialize our own services
    this.sessionService = new SessionFacade();
    this.scriptService = new ScriptFacade();
    this.terminalCollectionService = new TerminalCollectionFacade();
  }

  async execute(options: ExportSessionOptions = {}): Promise<Result<ExportSessionResult>> {
    try {
      let sessions: Session[] = [];
      
      // Determine selection mode and get sessions accordingly
      if (options.selectionMode === 'ids' && options.sessionIds && options.sessionIds.length > 0) {
        // Export specific sessions by ID
        sessions = await this.getSessionsByIds(options.sessionIds);
      } else {
        // Use filter-based selection (default behavior)
        sessions = await this.getSessionsByFilters(options);
      }

      if (sessions.length === 0) {
        return { 
          ok: false, 
          error: new Error('No sessions found matching the specified criteria') 
        };
      }

      // Bundle sessions with their dependencies
      const sessionsWithDependencies = await this.bundleSessionDependencies(sessions);

      // Create export directory in Downloads
      const exportDir = await this.ensureExportDirectory();
      
      // Generate filename
      const filename = this.generateFilename(options.filename, options, sessionsWithDependencies);
      const filePath = path.join(exportDir, filename);

      // Calculate total counts
      const totalScripts = sessionsWithDependencies.reduce((sum, s) => sum + (s.bundledScripts?.length || 0), 0);
      const totalTerminalCollections = sessionsWithDependencies.reduce((sum, s) => sum + (s.bundledTerminalCollections?.length || 0), 0);

      // Prepare export data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          filters: {
            tags: options.tags || 'all',
            search: options.search || 'all',
            sessionIds: options.sessionIds || 'all'
          },
          totalSessions: sessionsWithDependencies.length,
          totalScripts: totalScripts,
          totalTerminalCollections: totalTerminalCollections,
          selectionMode: options.selectionMode || 'filter'
        },
        sessions: sessionsWithDependencies
      };

      // Write to file
      const jsonContent = JSON.stringify(exportData, null, 2);
      await fs.writeFile(filePath, jsonContent, 'utf8');

      return {
        ok: true,
        value: {
          filePath,
          sessionCount: sessionsWithDependencies.length,
          scriptCount: totalScripts,
          terminalCollectionCount: totalTerminalCollections,
          exportedAt: exportData.metadata.exportedAt,
          selectedSessions: sessionsWithDependencies,
          filters: {
            tags: options.tags,
            search: options.search,
            sessionIds: options.sessionIds
          }
        }
      };

    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Export failed')
      };
    }
  }

  private async getSessionsByIds(sessionIds: string[]): Promise<Session[]> {
    const sessions: Session[] = [];
    
    for (const id of sessionIds) {
      try {
        const result = await this.sessionService.resumeSession(id);
        if (result.ok) {
          sessions.push(result.value);
        }
      } catch (error) {
        // Skip invalid IDs, continue with others
        console.warn(`Warning: Could not fetch session with ID ${id}:`, error);
      }
    }
    
    return sessions;
  }

  private async getSessionsByFilters(options: ExportSessionOptions): Promise<Session[]> {
    const sessionsResult = await this.sessionService.listSessions({
      tags: options.tags,
      search: options.search
    });

    if (!sessionsResult.ok) {
      throw new Error(`Failed to get sessions: ${sessionsResult.error.message}`);
    }

    return sessionsResult.value;
  }

  private async bundleSessionDependencies(sessions: Session[]): Promise<SessionWithDependencies[]> {
    const sessionsWithDependencies: SessionWithDependencies[] = [];

    for (const session of sessions) {
      const sessionWithDeps: SessionWithDependencies = { ...session };

      // Bundle scripts if referenced
      if (session.scripts && session.scripts.length > 0) {
        const bundledScripts = [];
        for (const scriptId of session.scripts) {
          try {
            const scriptResult = await this.scriptService.getScriptById(scriptId);
            if (scriptResult.ok) {
              bundledScripts.push(scriptResult.value);
            }
          } catch (error) {
            console.warn(`Warning: Could not fetch script with ID ${scriptId}:`, error);
          }
        }
        sessionWithDeps.bundledScripts = bundledScripts;
      }

      // Bundle terminal collections if referenced
      if (session.terminalCollections && session.terminalCollections.length > 0) {
        const bundledTerminalCollections = [];
        for (const tcId of session.terminalCollections) {
          try {
            const tcResult = await this.terminalCollectionService.getTerminalCollectionById(tcId);
            if (tcResult.ok) {
              // Get terminal collection with scripts loaded
              const tcWithScriptsResult = await this.terminalCollectionService.getTerminalCollections({ 
                loadScripts: true 
              });
              if (tcWithScriptsResult.ok) {
                const found = tcWithScriptsResult.value.find((tc: any) => tc.id === tcId);
                if (found) {
                  bundledTerminalCollections.push(found);
                }
              }
            }
          } catch (error) {
            console.warn(`Warning: Could not fetch terminal collection with ID ${tcId}:`, error);
          }
        }
        sessionWithDeps.bundledTerminalCollections = bundledTerminalCollections;
      }

      sessionsWithDependencies.push(sessionWithDeps);
    }

    return sessionsWithDependencies;
  }

  private async ensureExportDirectory(): Promise<string> {
    const downloadsPath = this.getDownloadsPath();
    const exportDir = path.join(downloadsPath, 'codestate-sessions');
    
    try {
      await fs.mkdir(exportDir, { recursive: true, mode: 0o755 });
    } catch (error) {
      // If we can't create the directory, fall back to Downloads root
      return downloadsPath;
    }
    
    return exportDir;
  }

  private getDownloadsPath(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    return path.join(home, 'Downloads');
  }

  private generateFilename(customName?: string, options?: ExportSessionOptions, sessions?: SessionWithDependencies[]): string {
    if (customName) {
      // Ensure .json extension
      return customName.endsWith('.json') ? customName : `${customName}.json`;
    }

    // Generate timestamped filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .slice(0, 19); // Remove milliseconds and timezone

    let prefix = 'sessions';
    
    if (options?.sessionIds && options.sessionIds.length > 0) {
      // If exporting specific IDs, use "selected-sessions"
      prefix = `selected-sessions-${options.sessionIds.length}`;
    } else if (options?.tags && options.tags.length > 0) {
      // If filtering by tags, include that in the name
      prefix = `${options.tags.join('-')}-sessions`;
    } else if (options?.search) {
      // If filtering by search, include that in the name
      prefix = `search-${options.search.replace(/[^a-zA-Z0-9]/g, '-')}-sessions`;
    }

    return `${prefix}-${timestamp}.json`;
  }
} 