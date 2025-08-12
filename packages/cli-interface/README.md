# CodeState CLI

A powerful command-line interface for CodeState - a developer context engine for saving and resuming your full development environment.

## Overview

CodeState CLI provides a comprehensive command-line interface for managing your development context, including scripts, sessions, configurations, and git operations. It features both traditional CLI commands and an interactive TUI (Text User Interface) for enhanced user experience.

## Features

### 🚀 Script Management
- **Create Scripts**: Define reusable development scripts
- **Update Scripts**: Modify existing scripts with ease
- **Delete Scripts**: Remove scripts by ID or root path
- **List Scripts**: View all scripts or filter by project
- **Import/Export**: Share scripts across environments

### 💾 Session Management
- **Save Sessions**: Capture your current development state
- **Resume Sessions**: Restore previous development contexts
- **List Sessions**: View all saved sessions
- **Update Sessions**: Modify session metadata
- **Delete Sessions**: Clean up old sessions

### ⚙️ Configuration Management
- **Show Config**: Display current configuration
- **Update Config**: Modify settings interactively
- **Export Config**: Backup your configuration
- **Import Config**: Restore configuration from backup
- **Reset Config**: Restore default settings

### 🔧 Git Integration
- **Git Status**: Check repository state
- **Stash Management**: Create, list, and apply stashes
- **Commit Changes**: Stage and commit modifications
- **Dirty Data**: Track uncommitted changes

### 🎯 IDE Integration
- **Multi-IDE Support**: Works with VS Code, WebStorm, and more
- **Open Projects**: Launch projects in your preferred IDE
- **File Management**: Open specific files in IDE

## Installation

```bash
npm install -g codestate-cli
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
codestate scripts show --root-path /path/to/project

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

## Interactive Mode

CodeState CLI includes an interactive TUI for enhanced user experience:

```bash
# Launch interactive mode for scripts
codestate scripts

# Launch interactive mode for sessions
codestate session

# Launch interactive mode for configuration
codestate config
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

## Configuration

CodeState CLI uses a configuration file to store settings. The default location is:

- **Windows**: `%APPDATA%/codestate/config.json`
- **macOS**: `~/Library/Application Support/codestate/config.json`
- **Linux**: `~/.config/codestate/config.json`

### Configuration Options

```json
{
  "defaultIDE": "vscode",
  "scriptsDirectory": "~/.codestate/scripts",
  "sessionsDirectory": "~/.codestate/sessions",
  "gitAutoCommit": false,
  "sessionAutoSave": true
}
```

## Integration with IDEs

CodeState CLI integrates with popular IDEs:

- **VS Code**: Open projects and files directly
- **WebStorm/IntelliJ**: Launch projects in JetBrains IDEs
- **Sublime Text**: Open files in Sublime
- **Vim/Neovim**: Open files in terminal editors

## Development

This package is part of the CodeState monorepo. For development setup, see the main [CodeState repository](https://github.com/codestate-cs/code-state-library).

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
