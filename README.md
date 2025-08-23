# CodeState Monorepo

A developer context engine for saving and resuming your full development environment.

## Recent Updates (v1.4.6)

### What's New in Version 1.4.6
- **Interface Improvements**: Enhanced `IScriptService` interface with better method organization
- **Code Quality**: Removed unused methods and improved interface consistency
- **Type Safety**: Better TypeScript interface alignment across services
- **Build System**: Improved build process and dependency management

### Changes from v1.4.2 to v1.4.6
- ✅ **Core Package**: Updated to v1.4.6 with interface improvements
- ✅ **CLI Package**: Updated to v1.4.6 with enhanced functionality
- 🔧 **Interface Cleanup**: Streamlined `IScriptService` interface methods
- 🏗️ **Build Improvements**: Enhanced build system and dependency resolution

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

## Build System

This project uses a dual-package build system that creates:
1. **Core Package** (`codestate-core`) - Domain models, use cases, and services
2. **CLI Package** (`codestate-cli`) - Main CLI executable with comprehensive command support

Both packages are published to npm and can be used independently or together.

See [BUILD_SYSTEM.md](./BUILD_SYSTEM.md) for detailed documentation.

## License
MIT 