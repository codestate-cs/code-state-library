import { IScriptService, IScriptRepository } from '../../domain/ports/IScriptService';
import { Script, LifecycleEvent } from '../../domain/models/Script';
import { Result, isSuccess, isFailure } from '../../domain/models/Result';
import { ILoggerService } from '../../domain/ports/ILoggerService';
import { ExportOptions, ExportResult } from '../../use-cases/scripts/ExportScripts';
import { ImportOptions, ImportResult } from '../../use-cases/scripts/ImportScripts';
import * as path from 'path';
import * as fs from 'fs/promises';

export class ScriptService implements IScriptService {
  constructor(
    private repository: IScriptRepository,
    private logger: ILoggerService
  ) {}

  async createScript(script: Script): Promise<Result<void>> {
    this.logger.debug('ScriptService.createScript called', { script });
    const result = await this.repository.createScript(script);
    if (isFailure(result)) {
      this.logger.error('Failed to create script', { error: result.error, script });
    } else {
      this.logger.log('Script created successfully', { script });
    }
    return result;
  }

  async getScriptById(id: string): Promise<Result<Script>> {
    this.logger.debug('ScriptService.getScriptById called', { id });
    const result = await this.repository.getScriptById(id);
    if (isFailure(result)) {
      this.logger.error('Failed to get script by ID', { error: result.error, id });
    } else {
      this.logger.log('Script retrieved by ID', { id, name: result.value.name });
    }
    return result;
  }

  async getScripts(options?: { rootPath?: string; lifecycle?: LifecycleEvent }): Promise<Result<Script[]>> {
    this.logger.debug('ScriptService.getScripts called', { options });
    const result = await this.repository.getScripts(options);
    if (isFailure(result)) {
      this.logger.error('Failed to get scripts', { error: result.error, options });
    } else {
      this.logger.log('Scripts retrieved successfully', { options, count: result.value.length });
    }
    return result;
  }

  async updateScript(id: string, script: Partial<Script>): Promise<Result<void>> {
    this.logger.debug('ScriptService.updateScript called', { id, script });
    const result = await this.repository.updateScript(id, script);
    if (isFailure(result)) {
      this.logger.error('Failed to update script', { error: result.error, id });
    } else {
      this.logger.log('Script updated successfully', { id });
    }
    return result;
  }

  async deleteScripts(ids: string[]): Promise<Result<void>> {
    this.logger.debug('ScriptService.deleteScripts called', { count: ids.length });
    const result = await this.repository.deleteScripts(ids);
    if (isFailure(result)) {
      this.logger.error('Failed to delete scripts', { error: result.error, count: ids.length });
    } else {
      this.logger.log('Scripts deleted successfully', { count: ids.length });
    }
    return result;
  }

  async exportScripts(options?: ExportOptions): Promise<Result<ExportResult>> {
    this.logger.debug('ScriptService.exportScripts called', { options });
    
    try {
      let scripts: Script[] = [];
      
      // Determine selection mode and get scripts accordingly
      if (options?.selectionMode === 'ids' && options.scriptIds && options.scriptIds.length > 0) {
        // Export specific scripts by ID
        scripts = await this.getScriptsByIdsForExport(options.scriptIds);
    } else {
        // Use filter-based selection (default behavior)
        scripts = await this.getScriptsByFiltersForExport(options);
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
      const filename = this.generateExportFilename(options, scripts);
      const filePath = path.join(exportDir, filename);

      // Prepare export data
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          filters: {
            rootPath: options?.rootPath || 'all',
            lifecycle: options?.lifecycle || 'all',
            scriptIds: options?.scriptIds || 'all'
          },
          totalScripts: scripts.length,
          selectionMode: options?.selectionMode || 'filter'
        },
        scripts: scripts
      };

      // Write to file
      const jsonContent = JSON.stringify(exportData, null, 2);
      await this.writeExportFile(filePath, jsonContent);

      const result: ExportResult = {
        filePath,
        scriptCount: scripts.length,
        exportedAt: exportData.metadata.exportedAt,
        selectedScripts: scripts,
        filters: {
          rootPath: options?.rootPath,
          lifecycle: options?.lifecycle,
          scriptIds: options?.scriptIds
        }
      };

      this.logger.log('Scripts exported successfully', { 
        options, 
        filePath: result.filePath, 
        count: result.scriptCount 
      });
      
      return { ok: true, value: result };

    } catch (error) {
      this.logger.error('Failed to export scripts', { error, options });
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Export failed')
      };
    }
  }

  async importScripts(filePath: string, options?: ImportOptions): Promise<Result<ImportResult>> {
    this.logger.debug('ScriptService.importScripts called', { filePath, options });
    
    try {
      // Read and parse JSON file
      const fileContent = await this.readImportFile(filePath);
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
      const scripts = this.extractScriptsFromImport(parsedData);
      if (scripts.length === 0) {
        return {
          ok: false,
          error: new Error('No valid scripts found in the file')
        };
      }

      // Validate scripts
      const validationResult = this.validateImportedScripts(scripts);
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
          const importResult = await this.processScriptForImport(script, options);
          
          if (importResult.resolution === 'skip') {
            results.skipped++;
          } else if (importResult.resolution === 'overwrite') {
            // For overwrite, we'd need an updateScript method that takes name+rootPath
            // For now, we'll skip and add to errors
            results.errors.push(`Overwrite not yet implemented for ${script.name}`);
            results.skipped++;
          } else if (importResult.resolution === 'rename') {
            // Generate new name
            const newName = await this.generateUniqueScriptName(script.name, script.rootPath);
            const renamedScript = { ...script, name: newName };
            
            if (!options?.dryRun) {
              const createResult = await this.createScript(renamedScript);
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
            if (!options?.dryRun) {
              const createResult = await this.createScript(script);
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

      this.logger.log('Scripts imported successfully', { 
        filePath, 
        options, 
        created: results.created, 
        skipped: results.skipped,
        errors: results.errors.length
      });

      return { ok: true, value: results };

    } catch (error) {
      this.logger.error('Failed to import scripts', { error, filePath, options });
      return {
        ok: false,
        error: error instanceof Error ? error : new Error('Import failed')
      };
    }
  }

  // Private helper methods for export
  private async getScriptsByIdsForExport(scriptIds: string[]): Promise<Script[]> {
    const scripts: Script[] = [];
    
    for (const id of scriptIds) {
      try {
        const result = await this.getScriptById(id);
        if (result.ok) {
          scripts.push(result.value);
        }
      } catch (error) {
        // Skip invalid IDs, continue with others
        this.logger.warn(`Warning: Could not fetch script with ID ${id}:`, { error });
      }
    }
    
    return scripts;
  }

  private async getScriptsByFiltersForExport(options?: ExportOptions): Promise<Script[]> {
    const scriptsResult = await this.getScripts({
      rootPath: options?.rootPath,
      lifecycle: options?.lifecycle
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

  private generateExportFilename(options?: ExportOptions, scripts?: Script[]): string {
    if (options?.filename) {
      // Ensure .json extension
      return options.filename.endsWith('.json') ? options.filename : `${options.filename}.json`;
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

  private async writeExportFile(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf8');
  }

  // Private helper methods for import
  private async readImportFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf8');
  }

  private extractScriptsFromImport(parsedData: any): Script[] {
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

  private validateImportedScripts(scripts: any[]): Result<void> {
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

  private async processScriptForImport(
    script: Script,
    options?: ImportOptions
  ): Promise<{ resolution: 'skip' | 'overwrite' | 'rename' }> {
    // Check for conflicts
    const existingScripts = await this.getScripts({
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
    switch (options?.conflictResolution) {
      case 'overwrite':
        return { resolution: 'overwrite' };
      case 'rename':
        return { resolution: 'rename' };
      case 'skip':
      default:
        return { resolution: 'skip' };
    }
  }

  private async generateUniqueScriptName(baseName: string, rootPath: string): Promise<string> {
    const existingScripts = await this.getScripts({ rootPath });
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