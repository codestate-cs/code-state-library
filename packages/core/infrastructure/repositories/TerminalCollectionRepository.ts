import { ITerminalCollectionRepository } from '@codestate/core/domain/ports/ITerminalCollectionRepository';
import { TerminalCollection, TerminalCollectionIndex } from '@codestate/core/domain/models/TerminalCollection';
import { LifecycleEvent } from '@codestate/core/domain/models/Script';
import { Result, isSuccess, isFailure } from '@codestate/core/domain/models/Result';
import { ILoggerService } from '@codestate/core/domain/ports/ILoggerService';
import { FileStorage } from '@codestate/infrastructure/services/FileStorage';
import { validateTerminalCollection, validateTerminalCollectionIndex } from '@codestate/core/domain/schemas/SchemaRegistry';
import { StorageError } from '@codestate/core/domain/types/ErrorTypes';

const TERMINAL_INDEX_PATH = 'terminals/index.json';
const TERMINAL_FILE_PREFIX = 'terminals/terminal-';
const TERMINAL_FILE_SUFFIX = '.json';

export class TerminalCollectionRepository implements ITerminalCollectionRepository {
  private storage: FileStorage;

  constructor(
    private logger: ILoggerService,
    storage: FileStorage
  ) {
    this.storage = storage;
  }

  private getTerminalFileName(name: string, rootPath: string): string {
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const safePath = rootPath.replace(/[^a-zA-Z0-9]/g, '_');
    return `${TERMINAL_FILE_PREFIX}${safeName}-${safePath}${TERMINAL_FILE_SUFFIX}`;
  }

  private async getIndex(): Promise<Result<TerminalCollectionIndex>> {
    const readResult = await this.storage.read(TERMINAL_INDEX_PATH);
    if (isFailure(readResult)) {
      // If file not found, return an empty index (don't create the file yet)
      if (readResult.error.code === 'STORAGE_READ_FAILED') {
        const emptyIndex: TerminalCollectionIndex = { entries: [] };
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
    const fileName = this.getTerminalFileName(terminalCollection.name, terminalCollection.rootPath);
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
    index.entries = index.entries.filter(e => !(e.name === terminalCollection.name && e.rootPath === terminalCollection.rootPath));

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

  async getTerminalCollection(name: string, rootPath?: string): Promise<Result<TerminalCollection>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollection called', { name, rootPath });

    // Get index to find file
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    let entry;
    if (rootPath) {
      // If rootPath is provided, search for exact match
      entry = indexResult.value.entries.find(
        e => e.name === name && e.rootPath === rootPath
      );
    } else {
      // If no rootPath provided, search by name only
      entry = indexResult.value.entries.find(e => e.name === name);
      
      // If multiple matches found, prefer the one in current directory
      if (!entry && indexResult.value.entries.length > 1) {
        const currentPath = process.cwd();
        entry = indexResult.value.entries.find(
          e => e.name === name && e.rootPath === currentPath
        );
      }
    }

    if (!entry) {
      this.logger.error('Terminal collection not found', { name, rootPath });
      return { ok: false, error: new StorageError(`Terminal collection '${name}' not found${rootPath ? ` for path '${rootPath}'` : ''}`, undefined, { name, rootPath }) };
    }

    // Read file
    const readResult = await this.storage.read(entry.referenceFile);
    if (isFailure(readResult)) {
      this.logger.error('Failed to read terminal collection file', { error: readResult.error });
      return readResult;
    }

    try {
      const validatedTerminalCollection = validateTerminalCollection(JSON.parse(readResult.value));
      this.logger.log('Terminal collection retrieved successfully', { name, rootPath });
      return { ok: true, value: validatedTerminalCollection };
    } catch (error) {
      this.logger.error('Failed to parse or validate terminal collection JSON', { error });
      return { ok: false, error: new StorageError('Invalid terminal collection data format', undefined, { error }) };
    }
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

  async getAllTerminalCollections(): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionRepository.getAllTerminalCollections called');

    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    const terminalCollections: TerminalCollection[] = [];

    for (const entry of indexResult.value.entries) {
      const terminalCollectionResult = await this.getTerminalCollection(entry.name, entry.rootPath);
      if (isSuccess(terminalCollectionResult)) {
        terminalCollections.push(terminalCollectionResult.value);
      }
    }

    this.logger.log('All terminal collections retrieved', { count: terminalCollections.length });
    return { ok: true, value: terminalCollections };
  }

  async getTerminalCollectionsByRootPath(rootPath: string): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollectionsByRootPath called', { rootPath });

    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    const terminalCollections: TerminalCollection[] = [];

    for (const entry of indexResult.value.entries) {
      if (entry.rootPath === rootPath) {
        const terminalCollectionResult = await this.getTerminalCollection(entry.name, entry.rootPath);
        if (isSuccess(terminalCollectionResult)) {
          terminalCollections.push(terminalCollectionResult.value);
        }
      }
    }

    this.logger.log('Terminal collections retrieved by root path', { rootPath, count: terminalCollections.length });
    return { ok: true, value: terminalCollections };
  }

  async getTerminalCollectionsByLifecycle(lifecycle: LifecycleEvent, rootPath: string): Promise<Result<TerminalCollection[]>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollectionsByLifecycle called', { lifecycle, rootPath });

    const terminalCollectionsResult = await this.getTerminalCollectionsByRootPath(rootPath);
    if (isFailure(terminalCollectionsResult)) {
      return terminalCollectionsResult;
    }

    const filteredCollections = terminalCollectionsResult.value.filter(
      collection => collection.lifecycle.includes(lifecycle)
    );

    this.logger.log('Terminal collections filtered by lifecycle', { lifecycle, rootPath, count: filteredCollections.length });
    return { ok: true, value: filteredCollections };
  }

  async updateTerminalCollection(name: string, rootPath: string, terminalCollectionUpdate: Partial<TerminalCollection>): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.updateTerminalCollection called', { name, rootPath, terminalCollectionUpdate });

    // Get existing terminal collection
    const existingResult = await this.getTerminalCollection(name, rootPath);
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
    const fileName = this.getTerminalFileName(name, rootPath);
    const writeResult = await this.storage.write(fileName, JSON.stringify(updatedTerminalCollection));
    if (isFailure(writeResult)) {
      this.logger.error('Failed to save updated terminal collection', { error: writeResult.error });
      return writeResult;
    }

    this.logger.log('Terminal collection updated successfully', { name, rootPath });
    return { ok: true, value: undefined };
  }

  async deleteTerminalCollection(name: string, rootPath: string): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.deleteTerminalCollection called', { name, rootPath });

    // Get index to find file
    const indexResult = await this.getIndex();
    if (isFailure(indexResult)) {
      return indexResult;
    }

    const entry = indexResult.value.entries.find(
      e => e.name === name && e.rootPath === rootPath
    );

    if (!entry) {
      this.logger.error('Terminal collection not found for deletion', { name, rootPath });
      return { ok: false, error: new StorageError(`Terminal collection '${name}' not found for path '${rootPath}'`, undefined, { name, rootPath }) };
    }

    // Delete file
    const deleteResult = await this.storage.delete(entry.referenceFile);
    if (isFailure(deleteResult)) {
      this.logger.error('Failed to delete terminal collection file', { error: deleteResult.error });
      return deleteResult;
    }

    // Update index
    const updatedEntries = indexResult.value.entries.filter(
      e => !(e.name === name && e.rootPath === rootPath)
    );
    const updateIndexResult = await this.storage.write(TERMINAL_INDEX_PATH, JSON.stringify({ entries: updatedEntries }));
    if (isFailure(updateIndexResult)) {
      this.logger.error('Failed to update index after deletion', { error: updateIndexResult.error });
      return updateIndexResult;
    }

    this.logger.log('Terminal collection deleted successfully', { name, rootPath });
    return { ok: true, value: undefined };
  }

  async deleteTerminalCollectionsByRootPath(rootPath: string): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.deleteTerminalCollectionsByRootPath called', { rootPath });

    const terminalCollectionsResult = await this.getTerminalCollectionsByRootPath(rootPath);
    if (isFailure(terminalCollectionsResult)) {
      return terminalCollectionsResult;
    }

    for (const terminalCollection of terminalCollectionsResult.value) {
      const deleteResult = await this.deleteTerminalCollection(terminalCollection.name, terminalCollection.rootPath);
      if (isFailure(deleteResult)) {
        this.logger.error('Failed to delete terminal collection', { error: deleteResult.error, name: terminalCollection.name });
        return deleteResult;
      }
    }

    this.logger.log('All terminal collections deleted for root path', { rootPath });
    return { ok: true, value: undefined };
  }

  async getTerminalCollectionIndex(): Promise<Result<TerminalCollectionIndex>> {
    this.logger.debug('TerminalCollectionRepository.getTerminalCollectionIndex called');
    return this.getIndex();
  }

  async updateTerminalCollectionIndex(index: TerminalCollectionIndex): Promise<Result<void>> {
    this.logger.debug('TerminalCollectionRepository.updateTerminalCollectionIndex called');

    try {
      validateTerminalCollectionIndex(index);
    } catch (error) {
      this.logger.error('Index validation failed', { error });
      return { ok: false, error: new StorageError('Index validation failed', undefined, { error }) };
    }

    const writeResult = await this.storage.write(TERMINAL_INDEX_PATH, JSON.stringify(index));
    if (isFailure(writeResult)) {
      this.logger.error('Failed to write index file', { error: writeResult.error });
      return writeResult;
    }

    return { ok: true, value: undefined };
  }
}

