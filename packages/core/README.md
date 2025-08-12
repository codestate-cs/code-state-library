# CodeState Core

The core domain models, use cases, and services for CodeState - a developer context engine for saving and resuming your full development environment.

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
- **ConfigService**: Configuration management with validation
- **ScriptService**: Script CRUD operations and execution
- **SessionService**: Session persistence and restoration
- **GitService**: Git repository state management
- **IDEService**: IDE integration and file management

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
  ConfigService, 
  ScriptService, 
  SessionService,
  GitService,
  IDEService 
} from 'codestate-core';

// Initialize services
const configService = new ConfigService();
const scriptService = new ScriptService();
const sessionService = new SessionService();

// Create a new script
const script = await scriptService.createScript({
  name: 'setup-project',
  content: 'npm install && npm run build',
  rootPath: '/path/to/project'
});

// Save current session
const session = await sessionService.saveSession({
  name: 'feature-development',
  scripts: [script],
  gitStatus: await gitService.getGitStatus()
});
```

## API Reference

### Core Services

#### ConfigService
- `getConfig()` - Retrieve current configuration
- `updateConfig(config)` - Update configuration
- `exportConfig()` - Export configuration to file
- `importConfig(filePath)` - Import configuration from file

#### ScriptService
- `createScript(scriptData)` - Create new script
- `updateScript(id, updates)` - Update existing script
- `deleteScript(id)` - Delete script
- `getScripts()` - Get all scripts
- `getScriptsByRootPath(rootPath)` - Get scripts for specific project

#### SessionService
- `saveSession(sessionData)` - Save current development session
- `resumeSession(id)` - Resume saved session
- `listSessions()` - List all saved sessions
- `deleteSession(id)` - Delete session

#### GitService
- `getGitStatus()` - Get current git repository status
- `getDirtyData()` - Get uncommitted changes
- `commitChanges(message)` - Commit changes
- `createStash(message)` - Create git stash
- `applyStash(id)` - Apply git stash

#### IDEService
- `getAvailableIDEs()` - Get list of available IDEs
- `openIDE(ideType, path)` - Open project in specific IDE
- `openFiles(files)` - Open specific files in IDE

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
