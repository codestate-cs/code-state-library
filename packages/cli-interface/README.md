# @codestate/cli

A powerful command-line interface for CodeState - a developer context engine for saving and resuming your full development environment.

## Overview

CodeState CLI provides a comprehensive command-line interface for managing your development context, including scripts, sessions, configurations, and git operations. It features both traditional CLI commands and an interactive TUI (Text User Interface) for enhanced user experience.

## Features

### 🚀 Script Management
- **Create Scripts**: Define reusable development scripts with interactive prompts
- **Update Scripts**: Modify existing scripts with ease
- **Delete Scripts**: Remove scripts by ID or root path
- **List Scripts**: View all scripts or filter by project
- **Import/Export**: Share scripts across environments
- **Resume Scripts**: Execute saved scripts with full context

### 💾 Session Management
- **Save Sessions**: Capture your current development state including open files, git status, and terminal commands
- **Resume Sessions**: Restore previous development contexts with file positions and terminal state
- **List Sessions**: View all saved sessions with metadata
- **Update Sessions**: Modify session metadata and notes
- **Delete Sessions**: Clean up old sessions

### ⚙️ Configuration Management
- **Show Config**: Display current configuration settings
- **Update Config**: Modify settings interactively
- **Export Config**: Backup your configuration to file
- **Import Config**: Restore configuration from backup
- **Reset Config**: Restore default settings

### 🔧 Git Integration
- **Git Status**: Check repository state and changes
- **Stash Management**: Create, list, and apply stashes
- **Commit Changes**: Stage and commit modifications
- **Dirty Data**: Track uncommitted changes

### 🎯 IDE Integration
- **Multi-IDE Support**: Works with VS Code, WebStorm, and more
- **Open Projects**: Launch projects in your preferred IDE
- **File Management**: Open specific files in IDE

### 🖥️ Terminal Collections
- **Create Terminal Collections**: Group related terminal commands
- **Execute Collections**: Run multiple commands in sequence
- **List Collections**: View all terminal collections
- **Show Collections**: Get detailed information about specific collections
- **Delete Collections**: Remove terminal collections with interactive TUI
- **Manage Collections**: Update and delete collections

### 🔄 Reset Operations
- **Comprehensive Reset**: Reset sessions, scripts, terminals, config, or all data
- **Interactive Reset**: User-friendly interface with confirmation prompts
- **CLI Flags**: Support for `--all`, `--sessions`, `--scripts`, `--terminals`, `--config` flags

### ✨ Enhanced User Experience
- **CLI Spinners**: Professional loading animations for all operations
  - Visual feedback during long-running commands
  - Smooth 10-frame animations with consistent timing
  - Cross-platform compatibility (Windows, Linux, macOS)
- **Professional Logging**: Clean, consistent output formatting
  - Automatic symbol addition (✅, ❌, ⚠️) by logger methods
  - User-friendly error messages without technical details
  - Consistent experience across all CLI commands

## Installation

```bash
npm install -g @codestate/cli
```

## Quick Start

```bash
# Initialize CodeState in your project
codestate config show

# Create your first script
codestate scripts create

# Save your current development session
codestate session save

# List all your scripts
codestate scripts show
```

## Command Reference

### Scripts Commands

```bash
# Create a new script
codestate scripts create

# Show all scripts
codestate scripts show

# Show scripts for specific project
codestate scripts show-by-path /path/to/project

# Update a script
codestate scripts update <script-id>

# Delete a script
codestate scripts delete <script-id>

# Delete all scripts for a project
codestate scripts delete-by-root-path /path/to/project

# Export scripts to file
codestate scripts export --output scripts.json

# Import scripts from file
codestate scripts import --input scripts.json

# Resume a script
codestate scripts resume <script-name>
```

### Session Commands

```bash
# Save current session
codestate session save

# List all sessions
codestate session list

# Resume a session
codestate session resume <session-id>

# Update session metadata
codestate session update <session-id>

# Delete a session
codestate session delete <session-id>
```

### Configuration Commands

```bash
# Show current configuration
codestate config show

# Update configuration
codestate config update

# Export configuration
codestate config export --output config.json

# Import configuration
codestate config import --input config.json

# Reset to defaults
codestate config reset
```

### Terminal Collection Commands

```bash
# List all terminal collections
codestate terminals list

# Create a new terminal collection
codestate terminals create

# Get details of a specific collection
codestate terminals show <collection-name>

# Execute a terminal collection
codestate terminals resume <collection-name>

# Delete a terminal collection
codestate terminals delete [collection-name]
```

### Reset Commands

```bash
# Reset everything (interactive)
codestate reset

# Reset everything (non-interactive)
codestate reset --all

# Reset specific data types
codestate reset --sessions
codestate reset --scripts
codestate reset --terminals
codestate reset --config
```

## Interactive Mode

CodeState CLI includes an interactive TUI for enhanced user experience:

```bash
# Launch interactive mode for scripts
codestate scripts

# Launch interactive mode for sessions
codestate session

# Launch interactive mode for configuration
codestate config

# Launch interactive mode for terminal collections
codestate terminals
```

## Examples

### Creating a Development Script

```bash
codestate scripts create
# Follow the prompts to create a script:
# - Name: setup-project
# - Content: npm install && npm run build
# - Root Path: /path/to/your/project
```

### Saving a Development Session

```bash
# Save current state including open files, git status, and scripts
codestate session save
# Enter session name: feature-development
# Session saved with ID: abc123
```

### Resuming a Session

```bash
# List available sessions
codestate session list

# Resume a specific session
codestate session resume abc123
# This will restore your development environment
```

### Managing Configuration

```bash
# View current settings
codestate config show

# Update settings interactively
codestate config update
# Follow prompts to modify configuration
```

### Working with Terminal Collections

```bash
# List all terminal collections
codestate terminals list

# Execute a collection of commands
codestate terminals resume setup-project
# This will run all commands in the collection sequentially
```

### Resetting Data

```bash
# Interactive reset with confirmation prompts
codestate reset

# Reset everything without prompts
codestate reset --all

# Reset only sessions
codestate reset --sessions
```

## CLI Spinners and Enhanced UX

### Professional Loading Animations
CodeState CLI includes smooth, professional loading animations for all operations:

- **Visual Feedback**: Spinners show progress during long-running operations
- **Consistent Timing**: 10-frame animations with 80ms refresh rate
- **Cross-Platform**: Works seamlessly on Windows, Linux, and macOS
- **State Management**: Support for start, update, succeed, and fail states

### Professional Logging
All CLI output is designed for professional use:

- **Automatic Symbols**: Logger methods automatically add appropriate symbols
  - `logger.log()` → ✅ Success messages
  - `logger.error()` → ❌ Error messages
  - `logger.warn()` → ⚠️ Warning messages
- **Clean Messages**: User-friendly output without technical metadata
- **Consistent Formatting**: Professional appearance across all commands

### Examples of Enhanced UX

```bash
# Terminal collection creation with spinner
codestate terminals create
# Shows: 🚀 Creating terminal collection...
# Then: ✅ Terminal collection created successfully!

# Script execution with progress updates
codestate scripts resume my-script
# Shows: ⚡ Executing script...
# Then: ✅ Script completed successfully!

# Session loading with visual feedback
codestate session list
# Shows: 📋 Loading sessions...
# Then: ✅ Sessions loaded
```

## Configuration

CodeState CLI uses a configuration file to store settings. The default location is:

- **Windows**: `%APPDATA%/codestate/config.json`
- **macOS**: `~/Library/Application Support/codestate/config.json`
- **Linux**: `~/.config/codestate/config.json`

### Configuration Options

```json
{
  "ide": "vscode",
  "version": "1.0.0",
  "encryption": {
    "enabled": false
  },
  "storagePath": "~/.codestate",
  "logger": {
    "level": "LOG",
    "sinks": ["file"]
  },
  "experimental": {},
  "extensions": {}
}
```

## Integration with IDEs

CodeState CLI integrates with popular IDEs:

- **VS Code**: Open projects and files directly
  - Install the [CodeState IDE Extension](https://marketplace.visualstudio.com/items?itemName=karthikchinasani.codestate-ide) for seamless IDE integration
- **WebStorm/IntelliJ**: Launch projects in JetBrains IDEs
- **Sublime Text**: Open files in Sublime
- **Vim/Neovim**: Open files in terminal editors

> **Tip**: You can use both the CLI and IDE extension for most tasks. The CLI is great for terminal workflows and automation, while the IDE extension provides a native VS Code experience for managing your development context.

## Error Handling

CodeState CLI provides comprehensive error handling:

- **Graceful Error Messages**: Clear, actionable error messages
- **Exit Codes**: Proper exit codes for automation
- **Logging**: Detailed logging for debugging
- **Recovery**: Automatic recovery from common errors

## Development

This package is part of the CodeState monorepo. For development setup and contributing, see the main [CodeState repository](https://github.com/codestate-cs/code-state-library).

### Building from Source

```bash
# Clone the repository
git clone https://github.com/codestate-cs/code-state-library.git
cd code-state-library

# Install dependencies
npm install

# Build CLI package
npm run build:cli

# Run in development mode
npm run dev
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/codestate-cs/code-state-library/blob/main/CONTRIBUTING.md) for details.

## License

MIT
