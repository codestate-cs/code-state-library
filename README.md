# CodeState Monorepo

A powerful development environment management tool that helps developers save, resume, and manage their development sessions with scripts, terminal collections, and Git state tracking.

## 🚀 Latest Release: v1.0.4

### ✨ New in v1.0.4
- **Enhanced Session Updates**: Session update command now supports terminal collections and scripts, providing full parity with session creation
- **Complete Feature Parity**: Update sessions with the same comprehensive options as creating new sessions
- **Improved User Experience**: Better session management workflow with consistent create/update operations

### 🔧 Previous Features
- **Session Management**: Save, resume, update, and delete development sessions
- **Script Management**: Create, manage, and execute development scripts
- **Terminal Collections**: Group and manage terminal setups for different projects
- **Git State Tracking**: Automatic capture of Git status, branches, and changes
- **Cross-Platform Support**: Works on Windows, macOS, and Linux with intelligent terminal detection
- **CLI Interface**: Powerful command-line interface with interactive prompts
- **File State Tracking**: Monitor project file changes and extensions

## Recent Updates (v1.0.3)

### What's New in Version 1.0.3
- **🔧 Script ID Fixes**: Proper script ID usage in terminal collections
- **💾 Data Integrity**: Enhanced data consistency and schema compliance
- **⚡ Performance**: Eliminated unnecessary script name searches
- **🛡️ Future-Proofing**: Script name changes won't break collections
- **🎯 Schema Compliance**: Proper adherence to ScriptReferenceSchema

### New Features in v1.0.3
- **Script ID References**: Terminal collections now use actual script UUIDs
  - Proper script linking using stable identifiers
  - Eliminated incorrect usage of script names as IDs
  - Enhanced data integrity and reliability
- **Enhanced Script Lookup**: Improved TerminalCollectionService
  - Fixed script finding logic in all methods
  - Proper script resolution using UUID references
  - Better error handling and logging

### Improvements in v1.0.3
- **Data Integrity**: Script references use stable UUIDs instead of changeable names
- **Performance**: Eliminated unnecessary name-based script searches
- **Schema Compliance**: Proper adherence to ScriptReferenceSchema requirements
- **Future-Proofing**: Script name changes won't break existing terminal collections

### Changes from v1.0.2 to v1.0.3
- ✅ **Core Package**: Updated to v1.0.3 with script ID fixes and improved data integrity
- ✅ **CLI Package**: Updated to v1.0.3 with enhanced terminal collection creation
- 🔧 **Script ID References**: Fixed terminal collection creation to use proper script IDs
- 🚀 **TerminalCollectionService**: Enhanced script lookup and resolution
- 🛡️ **Data Integrity**: Improved schema compliance and reference stability

## Structure

- `packages/core` - Domain models, use-cases, ports, services, and facades
- `packages/cli-interface` - CLI and TUI with comprehensive command support
- `tests` - Unit and integration tests

## Key Features

### Core Package (`@codestate/core`)
- **Domain Models**: Scripts, Sessions, Configurations, Git state, IDE integrations
- **Use Cases**: Business logic for all CodeState operations
- **Services**: Git management, IDE integration, terminal operations, file storage
- **Type Safety**: Full TypeScript support with Zod validation schemas

### CLI Package (`@codestate/cli`)
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