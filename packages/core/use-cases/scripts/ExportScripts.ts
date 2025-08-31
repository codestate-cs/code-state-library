import { Script, LifecycleEvent } from '../../domain/models/Script';
import { Result } from '../../domain/models/Result';
import { ScriptFacade } from '../../services/scripts/ScriptFacade';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ExportOptions {
  // Filter options
  rootPath?: string;
  lifecycle?: LifecycleEvent;
  scriptIds?: string[];  // Specific script IDs to export
  
  // Export options
  filename?: string;
  includeMetadata?: boolean;
  
  // Selection mode
  selectionMode?: 'filter' | 'ids' | 'interactive';  // How to select scripts
}

export interface ExportResult {
  filePath: string;
  scriptCount: number;
  exportedAt: string;
  selectedScripts: Script[];  // Which scripts were actually exported
  filters: {
    rootPath?: string;
    lifecycle?: LifecycleEvent;
    scriptIds?: string[];
  };
}

export class ExportScripts {
  private scriptService: ScriptFacade;

  constructor() {
    // Initialize our own script service
    this.scriptService = new ScriptFacade();
  }

  async execute(options: ExportOptions = {}): Promise<Result<ExportResult>> {
    try {
      let scripts: Script[] = [];
      
      // Determine selection mode and get scripts accordingly
      if (options.selectionMode === 'ids' && options.scriptIds && options.scriptIds.length > 0) {
        // Export specific scripts by ID
        scripts = await this.getScriptsByIds(options.scriptIds);
      } else {
        // Use filter-based selection (default behavior)
        scripts = await this.getScriptsByFilters(options);
      }

      if (scripts.length === 0) {
        return { 
          ok: false, 
          error: new Error('No scripts found matching the specified criteria') 
        };
      }

      // Create export directory in Downloads
      const exportDir = await this.ensureExportDirectory();
      
      // Generate filename
      const filename = this.generateFilename(options.filename, options, scripts);
      const filePath = path.join(exportDir, filename);

      // Prepare export data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          filters: {
            rootPath: options.rootPath || 'all',
            lifecycle: options.lifecycle || 'all',
            scriptIds: options.scriptIds || 'all'
          },
          totalScripts: scripts.length,
          selectionMode: options.selectionMode || 'filter'
        },
        scripts: scripts
      };

      // Write to file
      const jsonContent = JSON.stringify(exportData, null, 2);
      await fs.writeFile(filePath, jsonContent, 'utf8');

      return {
        ok: true,
        value: {
          filePath,
          scriptCount: scripts.length,
          exportedAt: exportData.metadata.exportedAt,
          selectedScripts: scripts,
          filters: {
            rootPath: options.rootPath,
            lifecycle: options.lifecycle,
            scriptIds: options.scriptIds
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

  private async getScriptsByIds(scriptIds: string[]): Promise<Script[]> {
    const scripts: Script[] = [];
    
    for (const id of scriptIds) {
      try {
        const result = await this.scriptService.getScriptById(id);
        if (result.ok) {
          scripts.push(result.value);
        }
      } catch (error) {
        // Skip invalid IDs, continue with others
        console.warn(`Warning: Could not fetch script with ID ${id}:`, error);
      }
    }
    
    return scripts;
  }

  private async getScriptsByFilters(options: ExportOptions): Promise<Script[]> {
    const scriptsResult = await this.scriptService.getScripts({
      rootPath: options.rootPath,
      lifecycle: options.lifecycle
    });

    if (!scriptsResult.ok) {
      throw new Error(`Failed to get scripts: ${scriptsResult.error.message}`);
    }

    return scriptsResult.value;
  }

  private async ensureExportDirectory(): Promise<string> {
    const downloadsPath = this.getDownloadsPath();
    const exportDir = path.join(downloadsPath, 'codestate-scripts');
    
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

  private generateFilename(customName?: string, options?: ExportOptions, scripts?: Script[]): string {
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

    let prefix = 'scripts';
    
    if (options?.scriptIds && options.scriptIds.length > 0) {
      // If exporting specific IDs, use "selected-scripts"
      prefix = `selected-scripts-${options.scriptIds.length}`;
    } else if (options?.rootPath) {
      // If filtering by rootPath, use project name
      const pathParts = options.rootPath.split('/');
      const projectName = pathParts[pathParts.length - 1] || 'project';
      prefix = `${projectName}-scripts`;
    } else if (options?.lifecycle) {
      // If filtering by lifecycle, include that in the name
      prefix = `${options.lifecycle}-scripts`;
    }

    return `${prefix}-${timestamp}.json`;
  }
} 