# CodeState Monorepo

A developer context engine for saving and resuming your full development environment.

## Recent Updates (v1.0.2)

### What's New in Version 1.0.2
- **🎯 CLI Spinners**: Professional loading animations for all CLI operations
- **🧹 Logger Cleanup**: Clean, user-friendly logging without technical metadata
- **🗑️ Delete Terminal Collections**: New CLI command for managing terminal collections
- **🔧 Repository Fixes**: Automatic index.json creation and proper data consistency
- **💫 Enhanced User Experience**: Consistent, professional CLI interface across all commands

### New Features in v1.0.2
- **CLI Spinners**: Visual feedback during long-running operations
  - Spinners for terminal, script, and session commands
  - 10-frame animation with smooth transitions
  - Cross-platform compatibility (Windows, Linux, macOS)
- **Delete Terminal Collections**: `codestate terminals delete` command
  - Interactive TUI for selecting collections to delete
  - Non-interactive mode with direct name specification
  - Proper cleanup of both data files and index files
- **Professional Logging**: Clean, consistent output formatting
  - Automatic symbol addition (✅, ❌, ⚠️) by logger methods
  - User-friendly error messages without internal details
  - Consistent experience across all CLI commands

### Improvements in v1.0.2
- **Data Integrity**: Enhanced repository management
  - TerminalCollectionRepository creates missing `index.json` automatically
  - ScriptRepository updates index after deletions
  - Proper backup file creation for all operations
- **Error Handling**: Improved user experience
  - Clear, actionable error messages
  - Graceful fallbacks for common failures
  - Professional error presentation

### Changes from v1.0.1 to v1.0.2
- ✅ **Core Package**: Updated to v1.0.2 with repository fixes and improvements
- ✅ **CLI Package**: Updated to v1.0.2 with spinners and enhanced UX
- 🆕 **CLISpinner Utility**: New reusable spinner component for CLI operations
- 🆕 **Delete Terminal Collections**: New CLI command for terminal collection management
- 🔧 **Repository Fixes**: Automatic index.json creation and data consistency
- 🎨 **Logger Cleanup**: Professional logging without manual symbols or metadata

## Structure

- `packages/core` - Domain models, use-cases, ports, services, and facades
- `packages/infrastructure` - Adapters, repositories, services
- `packages/cli-interface` - CLI and TUI with comprehensive command support
- `tests` - Unit and integration tests

## Key Features

### Core Package (`codestate-core`)
- **Domain Models**: Scripts, Sessions, Configurations, Git state, IDE integrations
- **Use Cases**: Business logic for all CodeState operations
- **Services**: Git management, IDE integration, terminal operations, file storage
- **Type Safety**: Full TypeScript support with Zod validation schemas

### CLI Package (`codestate-cli`)
- **Script Management**: Create, update, delete, and manage development scripts
- **Session Management**: Save and resume development sessions
- **Configuration Management**: Export, import, and manage settings
- **Terminal Collections**: Group and execute related terminal commands
- **Git Integration**: Status checking, stash management, commit operations
- **IDE Integration**: Multi-IDE support for project and file management
- **Reset Operations**: Comprehensive reset functionality with `codestate reset` command
- **Automatic Upgrades**: Smart version detection and automatic reset for breaking changes

## Getting Started

1. Install dependencies: `pnpm install` (or `npm install`)
2. Run CLI: `pnpm dev` or `npm run dev`
3. Build: `pnpm build`

## Scripts

- `dev` - Start CLI in dev mode
- `build` - Build both CLI and types packages
- `build:cli` - Build CLI package only
- `build:types` - Build types package only
- `test` - Run all tests

## Reset Command

The `codestate reset` command provides comprehensive data reset functionality:

### Options
- `--all` - Reset everything (sessions, scripts, terminals, config, logs)
- `--sessions` - Reset only sessions data
- `--scripts` - Reset only scripts data  
- `--terminals` - Reset only terminal collections data
- `--config` - Reset only configuration data

### Interactive Mode
Run `codestate reset` without flags for an interactive TUI with confirmation prompts.

### Automatic Reset on Upgrade
When upgrading from version 1.4.5 or below, CodeState automatically detects the upgrade and performs a complete reset to ensure compatibility with new versions.

## Build System

This project uses a dual-package build system that creates:
1. **Core Package** (`codestate-core`) - Domain models, use cases, and services
2. **CLI Package** (`codestate-cli`) - Main CLI executable with comprehensive command support

Both packages are published to npm and can be used independently or together.

See [BUILD_SYSTEM.md](./BUILD_SYSTEM.md) for detailed documentation.

## License
MIT 