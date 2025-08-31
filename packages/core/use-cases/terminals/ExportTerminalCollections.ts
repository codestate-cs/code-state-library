import {  TerminalCollectionWithScripts } from '../../domain/models/TerminalCollection';
import { LifecycleEvent } from '../../domain/models/Script';
import { Result } from '../../domain/models/Result';
import { TerminalCollectionFacade } from '../../services/terminals/TerminalCollectionFacade';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ExportTerminalCollectionOptions {
  // Filter options
  rootPath?: string;
  lifecycle?: LifecycleEvent;
  terminalCollectionIds?: string[];  // Specific terminal collection IDs to export
  
  // Export options
  filename?: string;
  includeMetadata?: boolean;
  
  // Selection mode
  selectionMode?: 'filter' | 'ids' | 'interactive';  // How to select terminal collections
}

export interface ExportTerminalCollectionResult {
  filePath: string;
  terminalCollectionCount: number;
  scriptCount: number;
  exportedAt: string;
  selectedTerminalCollections: TerminalCollectionWithScripts[];  // Which collections were actually exported
  filters: {
    rootPath?: string;
    lifecycle?: LifecycleEvent;
    terminalCollectionIds?: string[];
  };
}

export class ExportTerminalCollections {
  private terminalCollectionService: TerminalCollectionFacade;

  constructor() {
    // Initialize our own terminal collection service
    this.terminalCollectionService = new TerminalCollectionFacade();
  }

  async execute(options: ExportTerminalCollectionOptions = {}): Promise<Result<ExportTerminalCollectionResult>> {
    try {
      let terminalCollections: TerminalCollectionWithScripts[] = [];
      
      // Determine selection mode and get terminal collections accordingly
      if (options.selectionMode === 'ids' && options.terminalCollectionIds && options.terminalCollectionIds.length > 0) {
        // Export specific terminal collections by ID
        terminalCollections = await this.getTerminalCollectionsByIds(options.terminalCollectionIds);
      } else {
        // Use filter-based selection (default behavior)
        terminalCollections = await this.getTerminalCollectionsByFilters(options);
      }

      if (terminalCollections.length === 0) {
        return { 
          ok: false, 
          error: new Error('No terminal collections found matching the specified criteria') 
        };
      }

      // Create export directory in Downloads
      const exportDir = await this.ensureExportDirectory();
      
      // Generate filename
      const filename = this.generateFilename(options.filename, options, terminalCollections);
      const filePath = path.join(exportDir, filename);

      // Calculate total script count
      const totalScripts = terminalCollections.reduce((sum, tc) => sum + tc.scripts.length, 0);

      // Prepare export data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          filters: {
            rootPath: options.rootPath || 'all',
            lifecycle: options.lifecycle || 'all',
            terminalCollectionIds: options.terminalCollectionIds || 'all'
          },
          totalTerminalCollections: terminalCollections.length,
          totalScripts: totalScripts,
          selectionMode: options.selectionMode || 'filter'
        },
        terminalCollections: terminalCollections
      };

      // Write to file
      const jsonContent = JSON.stringify(exportData, null, 2);
      await fs.writeFile(filePath, jsonContent, 'utf8');

      return {
        ok: true,
        value: {
          filePath,
          terminalCollectionCount: terminalCollections.length,
          scriptCount: totalScripts,
          exportedAt: exportData.metadata.exportedAt,
          selectedTerminalCollections: terminalCollections,
          filters: {
            rootPath: options.rootPath,
            lifecycle: options.lifecycle,
            terminalCollectionIds: options.terminalCollectionIds
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

  private async getTerminalCollectionsByIds(terminalCollectionIds: string[]): Promise<TerminalCollectionWithScripts[]> {
    const terminalCollections: TerminalCollectionWithScripts[] = [];
    
    for (const id of terminalCollectionIds) {
      try {
        const result = await this.terminalCollectionService.getTerminalCollectionById(id);
        if (result.ok) {
          // Convert to TerminalCollectionWithScripts by loading scripts
          const withScriptsResult = await this.terminalCollectionService.getTerminalCollections({ 
            loadScripts: true 
          });
          if (withScriptsResult.ok) {
            const found = withScriptsResult.value.find((tc: any) => tc.id === id);
            if (found) {
              terminalCollections.push(found);
            }
          }
        }
      } catch (error) {
        // Skip invalid IDs, continue with others
        console.warn(`Warning: Could not fetch terminal collection with ID ${id}:`, error);
      }
    }
    
    return terminalCollections;
  }

  private async getTerminalCollectionsByFilters(options: ExportTerminalCollectionOptions): Promise<TerminalCollectionWithScripts[]> {
    const terminalCollectionsResult = await this.terminalCollectionService.getTerminalCollections({
      rootPath: options.rootPath,
      lifecycle: options.lifecycle,
      loadScripts: true
    });

    if (!terminalCollectionsResult.ok) {
      throw new Error(`Failed to get terminal collections: ${terminalCollectionsResult.error.message}`);
    }

    return terminalCollectionsResult.value as TerminalCollectionWithScripts[];
  }

  private async ensureExportDirectory(): Promise<string> {
    const downloadsPath = this.getDownloadsPath();
    const exportDir = path.join(downloadsPath, 'codestate-terminals');
    
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

  private generateFilename(customName?: string, options?: ExportTerminalCollectionOptions, terminalCollections?: TerminalCollectionWithScripts[]): string {
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

    let prefix = 'terminal-collections';
    
    if (options?.terminalCollectionIds && options.terminalCollectionIds.length > 0) {
      // If exporting specific IDs, use "selected-terminal-collections"
      prefix = `selected-terminal-collections-${options.terminalCollectionIds.length}`;
    } else if (options?.rootPath) {
      // If filtering by rootPath, use project name
      const pathParts = options.rootPath.split('/');
      const projectName = pathParts[pathParts.length - 1] || 'project';
      prefix = `${projectName}-terminal-collections`;
    } else if (options?.lifecycle) {
      // If filtering by lifecycle, include that in the name
      prefix = `${options.lifecycle}-terminal-collections`;
    }

    return `${prefix}-${timestamp}.json`;
  }
} 