# CodeState Core

The core domain models, use cases, and services for CodeState - a developer context engine for saving and resuming your full development environment.

## Version 1.4.6 Updates

### What's New
- **Interface Improvements**: Enhanced `IScriptService` interface with better method organization
- **Code Quality**: Removed unused methods and improved interface consistency  
- **Type Safety**: Better TypeScript interface alignment across services
- **Build System**: Improved build process and dependency management

### Changes from v1.4.2
- 🔧 **Interface Cleanup**: Streamlined `IScriptService` interface methods for better maintainability
- 🏗️ **Build Improvements**: Enhanced build system with better dependency resolution
- 📦 **Package Updates**: Updated to v1.4.5 with improved stability

## Overview

CodeState Core provides the foundational building blocks for managing development context, including:

- **Domain Models**: Scripts, Sessions, Configurations, Git state, IDE integrations
- **Use Cases**: Business logic for all CodeState operations
- **Services**: Core services for configuration, git management, IDE integration, and more
- **Type Safety**: Full TypeScript support with Zod validation schemas

## Features

### Domain Models
- **Script Management**: Create, update, and manage development scripts
- **Session Persistence**: Save and resume development sessions
- **Configuration System**: Flexible configuration management with validation
- **Git Integration**: Track repository state and changes
- **IDE Support**: Multi-IDE integration capabilities

### Core Services
- **ConfigurableLogger**: Logging service with multiple sinks
- **GitService**: Git repository state management
- **Terminal**: Terminal command execution and spawning
- **IDEService**: IDE integration and file management
- **FileStorage**: File storage with encryption support

### Use Cases
- **CreateScript**: Create new development scripts
- **GetScripts**: Retrieve and manage scripts
- **SaveSession**: Save development sessions
- **ListSessions**: List and filter sessions
- **ExportConfig/ImportConfig**: Configuration backup and restore

### Type Safety
- Full TypeScript definitions
- Zod validation schemas for all data models
- Comprehensive error handling with typed error registry

## Installation

```bash
npm install codestate-core
```

## Usage

```typescript
import { 
  ConfigurableLogger,
  GitService,
  Terminal,
  IDEService,
  FileStorage,
  CreateScript,
  GetScripts,
  SaveSession,
  ListSessions
} from 'codestate-core';

// Initialize services
const logger = new ConfigurableLogger({ level: 'LOG', sinks: ['console'] });
const gitService = new GitService();
const terminal = new Terminal();
const ideService = new IDEService();

// Create a new script using use case
const createScript = new CreateScript();
const scriptResult = await createScript.execute({
  name: 'setup-project',
  script: 'npm install && npm run build',
  rootPath: '/path/to/project'
});

// Get scripts using use case
const getScripts = new GetScripts();
const scripts = await getScripts.execute();

// Save session using use case
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
- `CreateScript.execute(scriptData)` - Create new script
- `GetScripts.execute()` - Get all scripts
- `GetScriptsByRootPath.execute(rootPath)` - Get scripts for specific project
- `UpdateScript.execute(id, updates)` - Update existing script
- `DeleteScript.execute(id)` - Delete script
- `ExportScripts.execute()` - Export scripts to JSON
- `ImportScripts.execute(json)` - Import scripts from JSON

##### Session Management
- `SaveSession.execute(sessionData)` - Save current development session
- `ResumeSession.execute(id)` - Resume saved session
- `ListSessions.execute(filter)` - List all saved sessions
- `UpdateSession.execute(id, updates)` - Update session metadata
- `DeleteSession.execute(id)` - Delete session

##### Configuration Management
- `GetConfig.execute()` - Retrieve current configuration
- `UpdateConfig.execute(updates)` - Update configuration
- `ExportConfig.execute(outputPath)` - Export configuration to file
- `ImportConfig.execute(filePath)` - Import configuration from file
- `ResetConfig.execute()` - Reset to default configuration

#### Services

##### GitService
- `getGitStatus()` - Get current git repository status
- `getDirtyData()` - Get uncommitted changes
- `commitChanges(message)` - Commit changes
- `createStash(message)` - Create git stash
- `applyStash(id)` - Apply git stash
- `listStashes()` - List all stashes
- `deleteStash(id)` - Delete stash

##### IDEService
- `getAvailableIDEs()` - Get list of available IDEs
- `openIDE(ideName, projectRoot)` - Open project in specific IDE
- `openFiles(request)` - Open specific files in IDE
- `isIDEInstalled(ideName)` - Check if IDE is installed

##### Terminal
- `execute(command, options)` - Execute terminal command
- `spawnTerminal(command, options)` - Spawn new terminal window
- `spawnApplication(command, options)` - Launch application
- `isCommandAvailable(command)` - Check if command is available

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type { 
  Script, 
  Session, 
  Config, 
  GitStatus,
  IDE 
} from 'codestate-core';
```

## Validation

All data models use Zod schemas for runtime validation:

```typescript
import { SchemaRegistry } from 'codestate-core';

// Validate script data
const scriptSchema = SchemaRegistry.getSchema('Script');
const validatedScript = scriptSchema.parse(scriptData);
```

## Error Handling

Comprehensive error handling with typed errors:

```typescript
import { ErrorRegistry, ErrorTypes } from 'codestate-core';

try {
  await scriptService.createScript(scriptData);
} catch (error) {
  if (error instanceof ErrorRegistry.getError(ErrorTypes.SCRIPT_CREATION_FAILED)) {
    // Handle script creation error
  }
}
```

## Development

This package is part of the CodeState monorepo. For development setup, see the main [CodeState repository](https://github.com/codestate-cs/code-state-library).

## License

MIT
