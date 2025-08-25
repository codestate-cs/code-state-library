# @codestate/core

The core domain models, use cases, and services for CodeState - a developer context engine for saving and resuming your full development environment.

## Overview

CodeState Core provides the foundational building blocks for managing development context, including domain models, use cases, and services that power the CodeState ecosystem.

## Features

### 🏗️ Domain Models
- **Script Management**: Create, update, and manage development scripts
- **Session Persistence**: Save and resume development sessions with full context
- **Configuration System**: Flexible configuration management with validation
- **Git Integration**: Track repository state and changes
- **IDE Support**: Multi-IDE integration capabilities
- **Terminal Collections**: Group and manage related terminal commands

### 🔧 Core Services
- **ConfigurableLogger**: Logging service with multiple sinks (console, file)
- **GitService**: Git repository state management and operations
- **Terminal**: Terminal command execution and process spawning
- **IDEService**: IDE integration and file management
- **FileStorage**: Secure file storage with optional encryption
- **SessionService**: Session persistence and management
- **ScriptService**: Script creation, retrieval, and management

### 🎯 Use Cases
- **Script Management**: Create, get, update, delete, export, and import scripts
- **Session Management**: Save, resume, list, update, and delete sessions
- **Configuration Management**: Get, update, export, import, and reset configuration
- **Git Operations**: Status checking, stash management, commit operations
- **IDE Integration**: Multi-IDE support for project and file management
- **Terminal Collections**: Create, execute, and manage terminal command groups

### 🛡️ Type Safety
- Full TypeScript definitions included
- Zod validation schemas for all data models
- Comprehensive error handling with typed error registry
- Strict type checking for all operations

## Installation

```bash
npm install @codestate/core
```

## Quick Start

```typescript
import { 
  ConfigurableLogger,
  GitService,
  Terminal,
  IDEService,
  CreateScript,
  GetScripts,
  SaveSession,
  ListSessions
} from '@codestate/core';

// Initialize services
const logger = new ConfigurableLogger({ 
  level: 'LOG', 
  sinks: ['console'] 
});

const gitService = new GitService();
const terminal = new Terminal();
const ideService = new IDEService();

// Create a new script
const createScript = new CreateScript();
const scriptResult = await createScript.execute({
  name: 'setup-project',
  script: 'npm install && npm run build',
  rootPath: '/path/to/project'
});

// Get all scripts
const getScripts = new GetScripts();
const scripts = await getScripts.execute();

// Save a development session
const saveSession = new SaveSession();
const session = await saveSession.execute({
  name: 'feature-development',
  projectRoot: '/path/to/project',
  notes: 'Working on new feature'
});
```

## API Reference

### Core Services

#### Use Cases

##### Script Management
```typescript
import { CreateScript, GetScripts, UpdateScript, DeleteScript } from '@codestate/core';

// Create new script
const createScript = new CreateScript();
await createScript.execute({
  name: 'build-project',
  script: 'npm run build',
  rootPath: '/path/to/project'
});

// Get all scripts
const getScripts = new GetScripts();
const scripts = await getScripts.execute();

// Get scripts for specific project
const getScriptsByPath = new GetScriptsByRootPath();
const projectScripts = await getScriptsByPath.execute('/path/to/project');

// Update script
const updateScript = new UpdateScript();
await updateScript.execute(scriptId, { script: 'npm run build && npm test' });

// Delete script
const deleteScript = new DeleteScript();
await deleteScript.execute(scriptId);

// Export/Import scripts
const exportScripts = new ExportScripts();
const scriptData = await exportScripts.execute();

const importScripts = new ImportScripts();
await importScripts.execute(scriptData);
```

##### Session Management
```typescript
import { SaveSession, ResumeSession, ListSessions, UpdateSession, DeleteSession } from '@codestate/core';

// Save current session
const saveSession = new SaveSession();
const session = await saveSession.execute({
  name: 'feature-work',
  projectRoot: '/path/to/project',
  notes: 'Working on new feature'
});

// List all sessions
const listSessions = new ListSessions();
const sessions = await listSessions.execute();

// Resume session
const resumeSession = new ResumeSession();
await resumeSession.execute(sessionId);

// Update session
const updateSession = new UpdateSession();
await updateSession.execute(sessionId, { notes: 'Updated notes' });

// Delete session
const deleteSession = new DeleteSession();
await deleteSession.execute(sessionId);
```

##### Configuration Management
```typescript
import { GetConfig, UpdateConfig, ExportConfig, ImportConfig, ResetConfig } from '@codestate/core';

// Get current configuration
const getConfig = new GetConfig();
const config = await getConfig.execute();

// Update configuration
const updateConfig = new UpdateConfig();
await updateConfig.execute({ ide: 'vscode', logLevel: 'INFO' });

// Export configuration
const exportConfig = new ExportConfig();
await exportConfig.execute('/path/to/config.json');

// Import configuration
const importConfig = new ImportConfig();
await importConfig.execute('/path/to/config.json');

// Reset to defaults
const resetConfig = new ResetConfig();
await resetConfig.execute();
```

#### Services

##### GitService
```typescript
import { GitService } from '@codestate/core';

const gitService = new GitService();

// Get git status
const status = await gitService.getGitStatus();

// Get uncommitted changes
const dirtyData = await gitService.getDirtyData();

// Commit changes
await gitService.commitChanges('feat: add new feature');

// Stash operations
await gitService.createStash('WIP: feature in progress');
const stashes = await gitService.listStashes();
await gitService.applyStash(stashId);
await gitService.deleteStash(stashId);
```

##### IDEService
```typescript
import { IDEService } from '@codestate/core';

const ideService = new IDEService();

// Get available IDEs
const ides = await ideService.getAvailableIDEs();

// Open project in IDE
await ideService.openIDE('vscode', '/path/to/project');

// Open specific files
await ideService.openFiles({
  ide: 'vscode',
  files: ['/path/to/file1.js', '/path/to/file2.js']
});

// Check if IDE is installed
const isInstalled = await ideService.isIDEInstalled('vscode');
```

##### Terminal
```typescript
import { Terminal } from '@codestate/core';

const terminal = new Terminal();

// Execute command
const result = await terminal.execute('npm install', {
  cwd: '/path/to/project'
});

// Spawn new terminal
await terminal.spawnTerminal('npm run dev', {
  cwd: '/path/to/project'
});

// Check command availability
const isAvailable = await terminal.isCommandAvailable('git');
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type { 
  Script, 
  Session, 
  Config, 
  GitStatus,
  IDE,
  TerminalCollection,
  Result
} from '@codestate/core';

// Use with full type safety
const script: Script = {
  id: 'script-1',
  name: 'build',
  script: 'npm run build',
  rootPath: '/path/to/project',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

## Validation

All data models use Zod schemas for runtime validation:

```typescript
import { SchemaRegistry } from '@codestate/core';

// Validate script data
const scriptSchema = SchemaRegistry.getSchema('Script');
const validatedScript = scriptSchema.parse(scriptData);
```

## Error Handling

Comprehensive error handling with typed errors:

```typescript
import { ErrorRegistry, ErrorTypes, Result, isSuccess, isFailure } from '@codestate/core';

// Handle results
const result: Result<Script> = await createScript.execute(scriptData);

if (isSuccess(result)) {
  console.log('Script created:', result.value);
} else {
  console.error('Failed to create script:', result.error);
}

// Handle exceptions
try {
  await scriptService.createScript(scriptData);
} catch (error) {
  if (error instanceof ErrorRegistry.getError(ErrorTypes.SCRIPT_CREATION_FAILED)) {
    // Handle script creation error
  }
}
```

## Configuration

The core package uses a configuration system that can be customized:

```typescript
import { getDefaultConfig } from '@codestate/core';

const config = getDefaultConfig();
// {
//   ide: 'vscode',
//   version: '1.0.0',
//   encryption: { enabled: false },
//   storagePath: '~/.codestate',
//   logger: { level: 'LOG', sinks: ['file'] },
//   experimental: {},
//   extensions: {}
// }
```

## Development

This package is part of the CodeState monorepo. For development setup and contributing, see the main [CodeState repository](https://github.com/codestate-cs/code-state-library).

## License

MIT
