import { ITerminalCollectionRepository } from '@codestate/core/domain/ports/ITerminalCollectionRepository';
import { TerminalCollection, TerminalCollectionIndex, TerminalCollectionWithScripts } from '@codestate/core/domain/models/TerminalCollection';
import { LifecycleEvent } from '@codestate/core/domain/models/Script';
import { Result, isSuccess, isFailure } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { validateTerminalCollection, validateTerminalCollectionIndex } from '@codestate/core/domain/schemas/SchemaRegistry';
import { StorageError } from '@codestate/core/domain/types/ErrorTypes';
import { IScriptService } from '@codestate/core/domain/ports/IScriptService';

const TERMINAL_INDEX_PATH = 'terminals/index.json';
const TERMINAL_FILE_PREFIX = 'terminals/';
const TERMINAL_FILE_SUFFIX = '.json';

export class TerminalCollectionRepository implements ITerminalCollectionRepository {
  private storage: FileStorage;

  constructor(
    private logger: ILoggerService,
    storage: FileStorage,
    private scriptService?: IScriptService
  ) {
    this.storage = storage;
  }

  private getTerminalFileName(id: string): string {
    return `${TERMINAL_FILE_PREFIX}${id}${TERMINAL_FILE_SUFFIX}`;
  }

  private async loadScriptsForTerminalCollection(terminalCollection: TerminalCollection): Promise<TerminalCollectionWithScripts> {
    const scripts: any[] = [];
    
    if (this.scriptService && terminalCollection.scriptReferences.length > 0) {
      try {
        // Get all scripts and filter by the references
        const allScriptsResult = await this.scriptService.getScripts();
        if (isSuccess(allScriptsResult)) {
          for (const scriptRef of terminalCollection.scriptReferences) {
            const script = allScriptsResult.value.find((s: any) => 
              s.id === scriptRef.id && s.rootPath === scriptRef.rootPath
            );
            if (script) {
              scripts.push(script);
            }
          }
        }
      } catch (error) {
        this.logger.warn('Failed to load scripts for terminal collection', { error, terminalCollectionId: terminalCollection.id });
      }
    }
    
    return {
      ...terminalCollection,
      scripts
    };
  }

  private async getIndex(): Promise<Result<TerminalCollectionIndex>> {
    const readResult = await this.storage.read(TERMINAL_INDEX_PATH);
    if (isFailure(readResult)) {
      // If file not found, create a new empty index
      if (readResult.error.code === 'STORAGE_READ_FAILED') {
        const emptyIndex: TerminalCollectionIndex = { entries: [] };
        // Create the index file automatically
        const writeResult = await this.storage.write(TERMINAL_INDEX_PATH, JSON.stringify(emptyIndex));
        if (isFailure(writeResult)) {
          this.logger.error('Failed to create terminal collection index', { error: writeResult.error });
          return { ok: false, error: writeResult.error };
        }
        this.logger.debug('Created new terminal collection index');
        return { ok: true, value: emptyIndex };
      }
      return { ok: false, error: readResult.error };
    }
    try {
      const validatedIndex = validateTerminalCollectionIndex(JSON.parse(readResult.value));
      return { ok: true, value: validatedIndex };
    } catch (error) {
      this.logger.error('Failed to load terminal collection index', { error });
      return { ok: false, error: new StorageError('Failed to load terminal collection index', undefined, { error }) };
    }
  }

  async createTerminalCollection(terminalCollection: TerminalCollection): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.createTerminalCollection called', { terminalCollection });

    try {
      // Validate terminal collection
      validateTerminalCollection(terminalCollection);
    } catch (error) {
      this.logger.error('Terminal collection validation failed', { error });
      return { ok: false, error: new StorageError('Terminal collection validation failed', undefined, { error }) };
    }

    // Write terminal collection file
    const fileName = this.getTerminalFileName(terminalCollection.id);
    const writeResult = await this.storage.write(fileName, JSON.stringify(terminalCollection));
    if (isFailure(writeResult)) return writeResult;

    // Update index
    const indexResult = await this.getIndex();
    let index: TerminalCollectionIndex;
    if (isFailure(indexResult)) {
      // If index doesn't exist, create new
      index = { entries: [] };
    } else {
      index = indexResult.value;
    }

    // Remove any existing entry for this name and rootPath
    index.entries = index.entries.filter(e => e.id !== terminalCollection.id);

    // Add new entry
    index.entries.push({
      id: terminalCollection.id,
      name: terminalCollection.name,
      rootPath: terminalCollection.rootPath,
      referenceFile: fileName
    });

    // Write index
    const indexWrite = await this.storage.write(TERMINAL_INDEX_PATH, JSON.stringify(index));
    if (isFailure(indexWrite)) return indexWrite;

    this.logger.log('Terminal collection created successfully', { name: terminalCollection.name, rootPath: terminalCollection.rootPath });
    return { ok: true, value: undefined };
  }



  async getTerminalCollectionById(id: string): Promise<Result<TerminalCollection>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollectionById called', { id });

    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    // Find entry by ID
    const entry = indexResult.value.entries.find(e => e.id === id);

    if (!entry) {
      this.logger.error('Terminal collection not found by ID', { id });
      return { ok: false, error: new StorageError(`Terminal collection with ID '${id}' not found`, undefined, { id }) };
    }

    // Read file
    const readResult = await this.storage.read(entry.referenceFile);
    if (isFailure(readResult)) {
      this.logger.error('Failed to read terminal collection file', { error: readResult.error });
      return readResult;
    }

    try {
      const validatedTerminalCollection = validateTerminalCollection(JSON.parse(readResult.value));
      this.logger.log('Terminal collection retrieved successfully by ID', { id });
      return { ok: true, value: validatedTerminalCollection };
    } catch (error) {
      this.logger.error('Failed to parse or validate terminal collection JSON', { error });
      return { ok: false, error: new StorageError('Invalid terminal collection data format', undefined, { error }) };
    }
  }

  async getTerminalCollections(options?: { rootPath?: string; lifecycle?: LifecycleEvent; loadScripts?: boolean }): Promise<Result<TerminalCollection[] | TerminalCollectionWithScripts[]>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollections called', { options });

    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    let filteredEntries = indexResult.value.entries;

    // Apply rootPath filter if provided
    if (options?.rootPath) {
      filteredEntries = filteredEntries.filter(e => e.rootPath === options.rootPath);
    }

    // Apply lifecycle filter if provided
    if (options?.lifecycle) {
      // We need to read the actual terminal collection files to check lifecycle
      if (options.loadScripts) {
        const terminalCollections: TerminalCollectionWithScripts[] = [];
        
        for (const entry of filteredEntries) {
          const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
          if (isSuccess(terminalCollectionResult) && terminalCollectionResult.value.lifecycle.includes(options.lifecycle!)) {
            // Load scripts for this terminal collection
            const terminalCollectionWithScripts = await this.loadScriptsForTerminalCollection(terminalCollectionResult.value);
            terminalCollections.push(terminalCollectionWithScripts);
          }
        }
        
        this.logger.log('Terminal collections with scripts retrieved with lifecycle filter', { options, count: terminalCollections.length });
        return { ok: true, value: terminalCollections };
      } else {
        const terminalCollections: TerminalCollection[] = [];
        
        for (const entry of filteredEntries) {
          const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
          if (isSuccess(terminalCollectionResult) && terminalCollectionResult.value.lifecycle.includes(options.lifecycle!)) {
            terminalCollections.push(terminalCollectionResult.value);
          }
        }
        
        this.logger.log('Terminal collections retrieved with lifecycle filter', { options, count: terminalCollections.length });
        return { ok: true, value: terminalCollections };
      }
    }

    // If no lifecycle filter, just apply rootPath filter and return data
    if (options?.rootPath) {
      if (options.loadScripts) {
        const terminalCollections: TerminalCollectionWithScripts[] = [];
        
        for (const entry of filteredEntries) {
          const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
          if (isSuccess(terminalCollectionResult)) {
            // Load scripts for this terminal collection
            const terminalCollectionWithScripts = await this.loadScriptsForTerminalCollection(terminalCollectionResult.value);
            terminalCollections.push(terminalCollectionWithScripts);
          }
        }
        
        this.logger.log('Terminal collections with scripts retrieved by root path', { rootPath: options.rootPath, count: terminalCollections.length });
        return { ok: true, value: terminalCollections };
      } else {
        const terminalCollections: TerminalCollection[] = [];
        
        for (const entry of filteredEntries) {
          const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
          if (isSuccess(terminalCollectionResult)) {
            terminalCollections.push(terminalCollectionResult.value);
          }
        }
        
        this.logger.log('Terminal collections retrieved by root path', { rootPath: options.rootPath, count: terminalCollections.length });
        return { ok: true, value: terminalCollections };
      }
    }

    // No filters - return all terminal collections
    if (options?.loadScripts) {
      const terminalCollections: TerminalCollectionWithScripts[] = [];
      
      for (const entry of filteredEntries) {
        const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
        if (isSuccess(terminalCollectionResult)) {
          // Load scripts for this terminal collection
          const terminalCollectionWithScripts = await this.loadScriptsForTerminalCollection(terminalCollectionResult.value);
          terminalCollections.push(terminalCollectionWithScripts);
        }
      }
      
      this.logger.log('All terminal collections with scripts retrieved', { count: terminalCollections.length });
      return { ok: true, value: terminalCollections };
    } else {
      const terminalCollections: TerminalCollection[] = [];
      
      for (const entry of filteredEntries) {
        const terminalCollectionResult = await this.getTerminalCollectionById(entry.id);
        if (isSuccess(terminalCollectionResult)) {
          terminalCollections.push(terminalCollectionResult.value);
        }
      }
      
      this.logger.log('All terminal collections retrieved', { count: terminalCollections.length });
      return { ok: true, value: terminalCollections };
    }
  }

  async updateTerminalCollection(id: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.updateTerminalCollection called', { id, terminalCollectionUpdate });

    // Get existing terminal collection
    const existingResult = await this.getTerminalCollectionById(id);
    if (isFailure(existingResult)) {
      return existingResult;
    }

    // Merge updates
    const updatedTerminalCollection = { ...existingResult.value, ...terminalCollectionUpdate };

    try {
      // Validate updated terminal collection
      validateTerminalCollection(updatedTerminalCollection);
    } catch (error) {
      this.logger.error('Updated terminal collection validation failed', { error });
      return { ok: false, error: new StorageError('Updated terminal collection validation failed', undefined, { error }) };
    }

    // Save updated terminal collection
    const fileName = this.getTerminalFileName(updatedTerminalCollection.id);
    const writeResult = await this.storage.write(fileName, JSON.stringify(updatedTerminalCollection));
    if (isFailure(writeResult)) {
      this.logger.error('Failed to save updated terminal collection', { error: writeResult.error });
      return writeResult;
    }

    this.logger.log('Terminal collection updated successfully', { id });
    return { ok: true, value: undefined };
  }



  async deleteTerminalCollections(ids: string[]): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.deleteTerminalCollections called', { ids });

    // Get index to find files
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    const entriesToDelete = indexResult.value.entries.filter(e => ids.includes(e.id));

    if (entriesToDelete.length === 0) {
      this.logger.error('No terminal collections found for deletion', { ids });
      return { ok: false, error: new StorageError(`No terminal collections found with the provided IDs`, undefined, { ids }) };
    }

    // Delete each terminal collection
    for (const entry of entriesToDelete) {
      // Delete main file
      const deleteResult = await this.storage.delete(entry.referenceFile);
      if (isFailure(deleteResult)) {
        this.logger.error('Failed to delete terminal collection file', { error: deleteResult.error, id: entry.id });
        return deleteResult;
      }

      // Delete backup file if it exists
      const backupFile = `${entry.referenceFile}.bak`;
      try {
        await this.storage.delete(backupFile);
        this.logger.debug('Backup file deleted', { backupFile });
      } catch (error) {
        // Backup file might not exist, which is fine
        this.logger.debug('Backup file not found or already deleted', { backupFile, error });
      }
    }

    // Update index by removing all deleted entries
    const updatedEntries = indexResult.value.entries.filter(e => !ids.includes(e.id));
    const updateIndexResult = await this.storage.write(TERMINAL_INDEX_PATH, JSON.stringify({ entries: updatedEntries }));
    if (isFailure(updateIndexResult)) {
      this.logger.error('Failed to update index after deletion', { error: updateIndexResult.error });
      return updateIndexResult;
    }

    this.logger.log('Terminal collections deleted successfully', { ids, count: entriesToDelete.length });
    return { ok: true, value: undefined };
  }
}

