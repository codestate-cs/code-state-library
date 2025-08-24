# CodeState Monorepo

A developer context engine for saving and resuming your full development environment.

## Recent Updates (v1.4.7)

### What's New in Version 1.4.7
- **🚀 Automatic Version Upgrade & Reset**: Smart detection and automatic reset for breaking changes
- **🔄 Unified Reset System**: Comprehensive `codestate reset` command with granular options
- **⚡ Enhanced CLI Commands**: New reset functionality with interactive TUI and CLI flags
- **🔧 Improved Configuration Management**: Shared default config utilities and version consistency
- **🐛 Bug Fixes**: Resolved TypeScript compilation errors and improved type safety

### New Features in v1.4.7
- **Automatic Reset on Upgrade**: When upgrading from v1.4.5 or below, automatically resets all data
- **Reset Command**: `codestate reset` with options for sessions, scripts, terminals, config, or all
- **Interactive TUI**: User-friendly interface for reset operations with confirmation prompts
- **CLI Flags**: Support for `--all`, `--sessions`, `--scripts`, `--terminals`, `--config` flags
- **Version Management**: Consistent version handling across all packages with build-time injection

### Changes from v1.4.6 to v1.4.7
- ✅ **Core Package**: Updated to v1.4.7 with reset functionality and version management
- ✅ **CLI Package**: Updated to v1.4.7 with comprehensive reset commands
- 🆕 **ResetAll Use Case**: New use case for comprehensive data reset operations
- 🆕 **CheckVersionUpgrade**: Automatic version upgrade detection and reset
- 🔧 **Configuration Utils**: Shared default config utilities for consistency
- 🐛 **TypeScript Fixes**: Resolved compilation errors and improved type safety

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