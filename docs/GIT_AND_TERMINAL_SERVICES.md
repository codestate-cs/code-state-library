# Git and Terminal Services

This document describes the implementation of Git and Terminal services for the CodeState application.

## Overview

The Git and Terminal services provide OS-agnostic functionality for:
- **Git Service**: Repository status checking, stash management, and dirty file detection
- **Terminal Service**: Cross-platform command execution with proper error handling

## Architecture

### Domain Layer

#### Models
- `Git.ts`: Git-related data structures (GitStatus, GitFile, GitStash, etc.)
- `Terminal.ts`: Terminal command execution models (TerminalCommand, TerminalResult, etc.)

#### Ports (Interfaces)
- `IGitService`: Contract for Git operations
- `ITerminalService`: Contract for terminal command execution

### Service Layer

#### Git Service
- `GitService`: Core implementation of Git operations
- `GitFacade`: Simplified interface for CLI/IDE integration

#### Terminal Service
- `TerminalService`: OS-agnostic command execution
- `TerminalFacade`: Simplified interface for CLI/IDE integration

### Use Cases
- `GetGitStatus`: Retrieve repository status
- `GetIsDirty`: Check if repository has uncommitted changes
- `GetDirtyData`: Get detailed dirty file information
- `CreateStash`: Create timestamp-based stashes
- `ApplyStash`: Apply stashes by name
- `ListStashes`: List all available stashes
- `DeleteStash`: Delete stashes by name

## Git Service Features

### Core Functionality

#### Status Operations
- `getIsDirty()`: Returns boolean indicating if repository has uncommitted changes
- `getDirtyData()`: Returns detailed GitStatus object with file information
- `getStatus()`: Comprehensive repository status including all file types

#### Stash Operations
- `createStash(message?)`: Creates stash with timestamp-based name (`codestate-stash-{timestamp}`)
- `applyStash(stashName)`: Applies stash by name with conflict detection
- `listStashes()`: Lists all stashes with metadata
- `deleteStash(stashName)`: Deletes stash by name

#### Repository Operations
- `isGitRepository()`: Checks if current directory is a Git repository
- `getCurrentBranch()`: Gets current branch name
- `getRepositoryRoot()`: Gets repository root path

### File Status Detection

The service parses Git status output and categorizes files into:
- **Modified**: Files with changes
- **Added**: New files staged for commit
- **Deleted**: Files marked for deletion
- **Untracked**: Files not tracked by Git
- **Renamed**: Files that have been renamed
- **Copied**: Files that have been copied

Each file includes staging status (staged/unstaged).

## Terminal Service Features

### Core Functionality

#### Command Execution
- `execute(command, options?)`: Execute single command with options
- `executeCommand(command)`: Execute TerminalCommand object
- `executeBatch(commands)`: Execute multiple commands sequentially

#### Utility Methods
- `isCommandAvailable(command)`: Check if command exists in PATH
- `getShell()`: Get default shell for current OS

### OS Support

The service automatically detects and uses appropriate shells:
- **Windows**: `cmd.exe` or `COMSPEC` environment variable
- **macOS**: `/bin/zsh` or `SHELL` environment variable
- **Linux/Unix**: `/bin/bash` or `SHELL` environment variable

### Error Handling

- **Timeout support**: Configurable command timeouts (default: 30s)
- **Process management**: Proper cleanup of child processes
- **Signal handling**: Graceful termination on SIGTERM
- **Error categorization**: Specific error types for different failure modes

## CLI Integration

### Git Commands

```bash
# Status and dirty checking
codestate git status [--path=/path/to/repo]
codestate git is-dirty [--path=/path/to/repo]
codestate git dirty-data [--path=/path/to/repo]

# Stash operations
codestate git stash create [--message="Custom message"]
codestate git stash apply <stash-name>
codestate git stash delete <stash-name>
codestate git stashes [--path=/path/to/repo]
```

### Command Examples

```bash
# Check if repository is dirty
codestate git is-dirty

# Get detailed status
codestate git status

# Create stash with custom message
codestate git stash create --message="WIP: feature implementation"

# Apply specific stash
codestate git stash apply stash@{0}

# List all stashes
codestate git stashes
```

## Error Handling

### Git Errors
- `GIT_NOT_REPOSITORY`: Directory is not a Git repository
- `GIT_COMMAND_FAILED`: Git command execution failed
- `GIT_STASH_NOT_FOUND`: Specified stash doesn't exist
- `GIT_STASH_CONFLICT`: Stash application resulted in conflicts

### Terminal Errors
- `TERMINAL_COMMAND_FAILED`: Command execution failed
- `TERMINAL_TIMEOUT`: Command execution timed out
- `TERMINAL_COMMAND_NOT_FOUND`: Command not found in PATH

## Security Considerations

### Git Service
- Validates repository paths to prevent directory traversal
- Sanitizes stash names and messages
- Handles Git configuration securely

### Terminal Service
- Validates command inputs
- Uses proper process isolation
- Implements timeout protection
- Sanitizes environment variables

## Testing

### Manual Testing
```bash
# Run the test script
node test-git-service.js

# Test CLI commands
codestate git status
codestate git is-dirty
codestate git stashes
```

### Integration Points
- Works with existing Config and Script services
- Integrates with logging system
- Compatible with error handling framework

## Future Enhancements

### Planned Features
- **Git Branch Management**: Create, switch, merge branches
- **Git Commit Operations**: Stage, commit, push, pull
- **Advanced Stash Features**: Stash with specific files, interactive stash
- **Terminal History**: Command history and replay
- **Parallel Execution**: Execute multiple commands concurrently
- **Streaming Output**: Real-time command output streaming

### Performance Optimizations
- **Caching**: Cache Git status for better performance
- **Batch Operations**: Optimize multiple Git operations
- **Lazy Loading**: Load Git information on demand

## Dependencies

### Core Dependencies
- `child_process`: Node.js process spawning
- `os`: OS detection and platform-specific logic
- `path`: Path manipulation utilities

### Internal Dependencies
- `@codestate/core/domain/models/*`: Domain models
- `@codestate/core/domain/ports/*`: Service interfaces
- `@codestate/infrastructure/services/*`: Infrastructure services

## Configuration

### Git Service Configuration
- Repository path (optional, defaults to current directory)
- Logger service (optional, defaults to FileLogger)
- Terminal service (optional, defaults to TerminalService)

### Terminal Service Configuration
- Default timeout (30 seconds)
- Shell detection (automatic)
- Environment variables (inherited from process)

## Troubleshooting

### Common Issues

1. **Git not found**: Ensure Git is installed and in PATH
2. **Permission denied**: Check file permissions for repository
3. **Timeout errors**: Increase timeout for long-running commands
4. **Shell not found**: Verify shell exists on target system

### Debug Mode
Enable debug logging by setting log level to 'DEBUG' in configuration.

## Contributing

When adding new Git or Terminal functionality:
1. Follow the existing architecture patterns
2. Add proper error handling and logging
3. Include comprehensive tests
4. Update documentation
5. Follow the established naming conventions 