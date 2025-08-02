# CodeState API Contract

This document provides the complete API contract for the CodeState library, exported from `packages/cli-api/main.ts`. This API is designed for integration with VSCode extensions and other external applications.

## Table of Contents

1. [Data Models](#data-models)
2. [Use Cases](#use-cases)
3. [Services](#services)
4. [Error Handling](#error-handling)
5. [Usage Examples](#usage-examples)

## Data Models

### Core Types

#### `Result<T, E = Error>`
Generic result type for all operations:
```typescript
type Result<T, E = Error> = Success<T> | Failure<E>;

interface Success<T> {
  ok: true;
  value: T;
}

interface Failure<E> {
  ok: false;
  error: E;
}
```

### Configuration Models

#### `Config`
```typescript
interface Config {
  version: string;
  ide: string;
  encryption: EncryptionConfig;
  storagePath: string;
  logger: LoggerConfig;
  experimental?: Record<string, boolean>;
  extensions?: Record<string, unknown>;
}

interface EncryptionConfig {
  enabled: boolean;
  encryptionKey?: string;
}
```

### Script Models

#### `Script`
```typescript
interface Script {
  name: string;
  rootPath: string;
  script: string;
}

interface ScriptIndexEntry {
  rootPath: string;
  referenceFile: string;
}

interface ScriptIndex {
  entries: ScriptIndexEntry[];
}

interface ScriptCollection {
  scripts: Script[];
}
```

### Session Models

#### `Session`
```typescript
interface Session {
  id: string;
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  files: FileState[];
  git: GitState;
  extensions?: Record<string, unknown>;
}

interface FileState {
  path: string;
  cursor?: { line: number; column: number };
  scroll?: { top: number; left: number };
  isActive: boolean;
}

interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}
```

### Git Models

#### `GitStatus`
```typescript
interface GitStatus {
  isDirty: boolean;
  dirtyFiles: GitFile[];
  newFiles: GitFile[];
  modifiedFiles: GitFile[];
  deletedFiles: GitFile[];
  untrackedFiles: GitFile[];
}

interface GitFile {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}

enum GitFileStatus {
  MODIFIED = 'modified',
  ADDED = 'added',
  DELETED = 'deleted',
  UNTRACKED = 'untracked',
  RENAMED = 'renamed',
  COPIED = 'copied',
  UPDATED = 'updated'
}

interface GitStash {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  branch: string;
}

interface GitStashResult {
  success: boolean;
  stashId?: string;
  error?: string;
}

interface GitStashApplyResult {
  success: boolean;
  conflicts?: string[];
  error?: string;
}
```

### IDE Models

#### `IDE`
```typescript
interface IDE {
  name: string;
  command: string;
  args: string[];
  supportedPlatforms: string[];
}

interface FileOpenRequest {
  ide: string;
  projectRoot: string;
  files: FileToOpen[];
}

interface FileToOpen {
  path: string;
  line?: number;
  column?: number;
  isActive?: boolean;
}
```

### Terminal Models

#### `TerminalCommand`
```typescript
interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

interface TerminalResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}

interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string;
}
```

## Use Cases

### Configuration Use Cases

#### `GetConfig`
```typescript
class GetConfig {
  constructor(configService?: IConfigService);
  async execute(): Promise<Result<Config>>;
}
```

#### `UpdateConfig`
```typescript
class UpdateConfig {
  constructor(configService?: IConfigService);
  async execute(partial: Partial<Config>): Promise<Result<Config>>;
}
```

#### `ResetConfig`
```typescript
class ResetConfig {
  constructor(configService?: IConfigService);
  async execute(): Promise<Result<Config>>;
}
```

#### `ExportConfig`
```typescript
class ExportConfig {
  constructor(configService?: IConfigService);
  async execute(): Promise<Result<string>>;
}
```

#### `ImportConfig`
```typescript
class ImportConfig {
  constructor(configService?: IConfigService);
  async execute(json: string): Promise<Result<Config>>;
}
```

### Script Use Cases

#### `CreateScript`
```typescript
class CreateScript {
  constructor(scriptService?: IScriptService);
  async execute(script: Script): Promise<Result<void>>;
}
```

#### `CreateScripts`
```typescript
class CreateScripts {
  constructor(scriptService?: IScriptService);
  async execute(scripts: Script[]): Promise<Result<void>>;
}
```

#### `GetScripts`
```typescript
class GetScripts {
  constructor(scriptService?: IScriptService);
  async execute(): Promise<Result<Script[]>>;
}
```

#### `GetScriptsByRootPath`
```typescript
class GetScriptsByRootPath {
  constructor(scriptService?: IScriptService);
  async execute(rootPath: string): Promise<Result<Script[]>>;
}
```

#### `UpdateScript`
```typescript
class UpdateScript {
  constructor(scriptService?: IScriptService);
  async execute(name: string, rootPath: string, scriptUpdate: Partial<Script>): Promise<Result<void>>;
}
```

#### `DeleteScript`
```typescript
class DeleteScript {
  constructor(scriptService?: IScriptService);
  async execute(name: string, rootPath: string): Promise<Result<void>>;
}
```

#### `DeleteScriptsByRootPath`
```typescript
class DeleteScriptsByRootPath {
  constructor(scriptService?: IScriptService);
  async execute(rootPath: string): Promise<Result<void>>;
}
```

#### `ExportScripts`
```typescript
class ExportScripts {
  constructor(scriptService?: IScriptService);
  async execute(): Promise<Result<string>>;
}
```

#### `ImportScripts`
```typescript
class ImportScripts {
  constructor(scriptService?: IScriptService);
  async execute(json: string): Promise<Result<void>>;
}
```

### Session Use Cases

#### `SaveSession`
```typescript
class SaveSession {
  constructor(sessionService?: ISessionService);
  async execute(input: {
    name: string;
    projectRoot: string;
    notes?: string;
    tags?: string[];
    files?: Session['files'];
    git: Session['git'];
    extensions?: Session['extensions'];
  }): Promise<Result<Session>>;
}
```

#### `UpdateSession`
```typescript
class UpdateSession {
  constructor(sessionService?: ISessionService);
  async execute(idOrName: string, input: {
    notes?: string;
    tags?: string[];
    files?: Session['files'];
    git?: Session['git'];
    extensions?: Session['extensions'];
  }): Promise<Result<Session>>;
}
```

#### `ResumeSession`
```typescript
class ResumeSession {
  constructor(sessionService?: ISessionService);
  async execute(idOrName: string): Promise<Result<Session>>;
}
```

#### `ListSessions`
```typescript
class ListSessions {
  constructor(sessionService?: ISessionService);
  async execute(filter?: { tags?: string[]; search?: string }): Promise<Result<Session[]>>;
}
```

#### `DeleteSession`
```typescript
class DeleteSession {
  constructor(sessionService?: ISessionService);
  async execute(idOrName: string): Promise<Result<void>>;
}
```

### Git Use Cases

#### `GetGitStatus`
```typescript
class GetGitStatus {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(): Promise<Result<GitStatus>>;
}
```

#### `GetIsDirty`
```typescript
class GetIsDirty {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(): Promise<Result<boolean>>;
}
```

#### `GetDirtyData`
```typescript
class GetDirtyData {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(): Promise<Result<GitStatus>>;
}
```

#### `CreateStash`
```typescript
class CreateStash {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(message?: string): Promise<Result<GitStashResult>>;
}
```

#### `ApplyStash`
```typescript
class ApplyStash {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(stashName: string): Promise<Result<GitStashApplyResult>>;
}
```

#### `ListStashes`
```typescript
class ListStashes {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(): Promise<Result<GitStash[]>>;
}
```

#### `DeleteStash`
```typescript
class DeleteStash {
  constructor(gitService?: IGitService, repositoryPath?: string);
  async execute(stashName: string): Promise<Result<boolean>>;
}
```

#### `GetCurrentCommit`
```typescript
class GetCurrentCommit {
  constructor(gitService?: IGitService);
  async execute(): Promise<Result<string>>;
}
```

#### `CommitChanges`
```typescript
class CommitChanges {
  constructor(gitService?: IGitService);
  async execute(message: string): Promise<Result<boolean>>;
}
```

### IDE Use Cases

#### `OpenIDE`
```typescript
class OpenIDE {
  constructor(ideService?: IIDEService);
  async execute(ideName: string, projectRoot: string): Promise<Result<boolean>>;
}
```

#### `OpenFiles`
```typescript
class OpenFiles {
  constructor(ideService?: IIDEService);
  async execute(request: FileOpenRequest): Promise<Result<boolean>>;
}
```

#### `GetAvailableIDEs`
```typescript
class GetAvailableIDEs {
  constructor(ideService?: IIDEService);
  async execute(): Promise<Result<IDE[]>>;
}
```

## Services

### `ConfigurableLogger` (CLILoggerFacade)
```typescript
class CLILoggerFacade {
  constructor();
  log(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  plainLog(message: string, meta?: Record<string, unknown>): void;
}
```

### `GitService` (GitFacade)
```typescript
class GitFacade implements IGitService {
  constructor(repositoryPath?: string, logger?: ILoggerService, terminalService?: ITerminalService);
  
  // Status operations
  async getIsDirty(): Promise<Result<boolean>>;
  async getDirtyData(): Promise<Result<GitStatus>>;
  async getStatus(): Promise<Result<GitStatus>>;
  
  // Stash operations
  async createStash(message?: string): Promise<Result<GitStashResult>>;
  async applyStash(stashName: string): Promise<Result<GitStashApplyResult>>;
  async listStashes(): Promise<Result<GitStash[]>>;
  async deleteStash(stashName: string): Promise<Result<boolean>>;
  
  // Repository operations
  async isGitRepository(): Promise<Result<boolean>>;
  async getCurrentBranch(): Promise<Result<string>>;
  async getCurrentCommit(): Promise<Result<string>>;
  async commitChanges(message: string): Promise<Result<boolean>>;
  async isGitConfigured(): Promise<Result<boolean>>;
  async getRepositoryRoot(): Promise<Result<string>>;
}
```

### `Terminal` (TerminalFacade)
```typescript
class TerminalFacade implements ITerminalService {
  constructor(logger?: ILoggerService);
  
  // Command execution
  async execute(command: string, options?: TerminalOptions): Promise<Result<TerminalResult>>;
  async executeCommand(command: TerminalCommand): Promise<Result<TerminalResult>>;
  
  // Batch operations
  async executeBatch(commands: TerminalCommand[]): Promise<Result<TerminalResult[]>>;
  
  // Terminal spawning
  async spawnTerminal(command: string, options?: TerminalOptions): Promise<Result<boolean>>;
  async spawnTerminalCommand(command: TerminalCommand): Promise<Result<boolean>>;
  
  // Utility methods
  async isCommandAvailable(command: string): Promise<Result<boolean>>;
  async getShell(): Promise<Result<string>>;
}
```

### `IDEService` (IDEFacade)
```typescript
class IDEFacade implements IIDEService {
  constructor();
  
  async openIDE(ideName: string, projectRoot: string): Promise<Result<boolean>>;
  async openFiles(request: FileOpenRequest): Promise<Result<boolean>>;
  async getAvailableIDEs(): Promise<Result<IDE[]>>;
  async isIDEInstalled(ideName: string): Promise<Result<boolean>>;
}
```

## Error Handling

All operations return a `Result<T>` type that can be either:
- `Success<T>`: Operation completed successfully with value of type T
- `Failure<E>`: Operation failed with error of type E (defaults to Error)

### Usage Pattern
```typescript
const result = await someUseCase.execute(params);
if (result.ok) {
  // Success case
  const value = result.value;
  // Use the value
} else {
  // Error case
  const error = result.error;
  // Handle the error
}
```

## Usage Examples

### Configuration Management
```typescript
import { GetConfig, UpdateConfig, ExportConfig } from '@codestate/cli-api';

// Get current configuration
const getConfig = new GetConfig();
const configResult = await getConfig.execute();
if (configResult.ok) {
  console.log('Current config:', configResult.value);
}

// Update configuration
const updateConfig = new UpdateConfig();
const updateResult = await updateConfig.execute({
  ide: 'vscode',
  experimental: { newFeature: true }
});

// Export configuration
const exportConfig = new ExportConfig();
const exportResult = await exportConfig.execute();
if (exportResult.ok) {
  console.log('Config JSON:', exportResult.value);
}
```

### Script Management
```typescript
import { CreateScript, GetScripts, UpdateScript } from '@codestate/cli-api';

// Create a new script
const createScript = new CreateScript();
await createScript.execute({
  name: 'build',
  rootPath: '/path/to/project',
  script: 'npm run build'
});

// Get all scripts
const getScripts = new GetScripts();
const scriptsResult = await getScripts.execute();
if (scriptsResult.ok) {
  scriptsResult.value.forEach(script => {
    console.log(`${script.name}: ${script.script}`);
  });
}
```

### Session Management
```typescript
import { SaveSession, ResumeSession, ListSessions } from '@codestate/cli-api';

// Save a session
const saveSession = new SaveSession();
const sessionResult = await saveSession.execute({
  name: 'feature-branch-work',
  projectRoot: '/path/to/project',
  notes: 'Working on new feature',
  tags: ['feature', 'in-progress'],
  files: [
    {
      path: '/path/to/project/src/main.ts',
      cursor: { line: 10, column: 5 },
      isActive: true
    }
  ],
  git: {
    branch: 'feature/new-feature',
    commit: 'abc123',
    isDirty: true
  }
});

// Resume a session
const resumeSession = new ResumeSession();
const resumeResult = await resumeSession.execute('feature-branch-work');
```

### Git Operations
```typescript
import { GetGitStatus, CreateStash, ApplyStash } from '@codestate/cli-api';

// Get git status
const getStatus = new GetGitStatus();
const statusResult = await getStatus.execute();
if (statusResult.ok) {
  const status = statusResult.value;
  console.log('Dirty files:', status.dirtyFiles.length);
}

// Create a stash
const createStash = new CreateStash();
const stashResult = await createStash.execute('WIP: feature work');
if (stashResult.ok && stashResult.value.success) {
  console.log('Stash created:', stashResult.value.stashId);
}
```

### IDE Operations
```typescript
import { OpenIDE, OpenFiles, GetAvailableIDEs } from '@codestate/cli-api';

// Get available IDEs
const getIDEs = new GetAvailableIDEs();
const idesResult = await getIDEs.execute();
if (idesResult.ok) {
  console.log('Available IDEs:', idesResult.value.map(ide => ide.name));
}

// Open files in IDE
const openFiles = new OpenFiles();
const openResult = await openFiles.execute({
  ide: 'vscode',
  projectRoot: '/path/to/project',
  files: [
    { path: '/path/to/project/src/main.ts', line: 10, isActive: true },
    { path: '/path/to/project/src/utils.ts', line: 5 }
  ]
});
```

### Terminal Operations
```typescript
import { Terminal } from '@codestate/cli-api';

// Execute a command
const terminal = new Terminal();
const result = await terminal.execute('npm install', {
  cwd: '/path/to/project',
  timeout: 30000
});

if (result.ok) {
  console.log('Command output:', result.value.stdout);
  console.log('Exit code:', result.value.exitCode);
}
```

## Integration Notes

1. **VSCode Extension Integration**: All use cases and services can be instantiated and used directly in VSCode extensions without dependency injection.

2. **Error Handling**: Always check the `ok` property of results before accessing the `value` property.

3. **Async Operations**: All operations are asynchronous and return Promises.

4. **Type Safety**: The API is fully typed with TypeScript, providing excellent IntelliSense support.

5. **Extensibility**: The API supports extension-specific data through the `extensions` field in Config and Session models.

6. **Logging**: Use the `ConfigurableLogger` for consistent logging across the application. 