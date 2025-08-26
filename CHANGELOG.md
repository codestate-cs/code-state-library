# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Enhanced IDE integration features
- Advanced script templating system
- Cloud synchronization capabilities

## [1.0.2] - 2024-12-19

### Added
- **CLI Spinners**: Professional loading animations for all CLI operations
  - Spinners for terminal, script, and session commands
  - Visual feedback during long-running operations
  - Consistent user experience across all CLI commands
- **Delete Terminal Collections**: New CLI command `codestate terminals delete`
  - Interactive TUI for selecting collections to delete
  - Non-interactive mode with direct name specification
  - Proper cleanup of both data files and index files

### Changed
- **Logger Cleanup**: Removed all manual symbol additions (✅, ❌, ⚠️)
  - `logger.log()` automatically adds ✅ symbols
  - `logger.error()` automatically adds ❌ symbols  
  - `logger.warn()` automatically adds ⚠️ symbols
- **User Experience**: Clean, professional logging without technical metadata
  - Removed extra parameters from all logger calls
  - User-friendly error messages without internal details
  - Consistent output formatting across all commands

### Fixed
- **TerminalCollectionRepository**: Automatic `index.json` creation
  - Creates missing `index.json` files automatically
  - Follows same pattern as ScriptRepository and SessionRepository
  - Prevents errors when index files don't exist
- **ScriptRepository**: Index updates after deletions
  - `deleteScript()` now updates `scripts/index.json` after modifications
  - `deleteScripts()` now updates `scripts/index.json` after modifications
  - Ensures data consistency between actual files and indexes
- **Data Integrity**: Proper backup file creation
  - `.bak` files created for all `index.json` and data files
  - Safe atomic file operations using `fs.rename`
  - Consistent backup strategy across all repositories

### Technical Improvements
- **CLISpinner Utility**: Reusable spinner component
  - 10-frame animation with 80ms refresh rate
  - Support for start, update, succeed, and fail states
  - Cross-platform compatibility (Windows, Linux, macOS)
- **Error Handling**: Improved error messages and recovery
  - Clear, actionable error messages for users
  - Proper exit codes for automation scenarios
  - Graceful fallbacks for common failure modes

## [1.0.1] - 2024-12-19

### Added
- **Linux Terminal Support**: Robust terminal detection and spawning
  - Automatic detection of available terminal emulators
  - Platform-specific argument handling for Linux
  - Support for gnome-terminal, konsole, xterm, and more
- **Cross-Platform Compatibility**: Enhanced terminal support
  - Windows: cmd, PowerShell, Windows Terminal
  - macOS: Terminal.app, iTerm2
  - Linux: Multiple terminal emulator detection

### Fixed
- **Terminal Spawning**: Resolved Linux terminal opening issues
  - Fixed hardcoded `gnome-terminal` dependency
  - Implemented fallback terminal detection
  - Added proper error handling for unsupported terminals

## [1.0.0] - 2024-12-19

### Added
- **Core Package**: `@codestate/core` - Foundation for CodeState
  - Domain models for Scripts, Sessions, and Configurations
  - Use cases for all business operations
  - Services for Git, IDE, Terminal, and File operations
  - Full TypeScript support with Zod validation
- **CLI Package**: `@codestate/cli` - Command-line interface
  - Script management (create, update, delete, execute)
  - Session management (save, resume, list, update, delete)
  - Configuration management (show, update, export, import, reset)
  - Terminal collections (create, execute, list, manage)
  - Git integration (status, stash, commit operations)
  - IDE integration (multi-IDE support)
  - Reset operations (comprehensive data reset functionality)
- **Interactive TUI**: User-friendly interfaces
  - Inquirer-based prompts for all operations
  - Confirmation dialogs for destructive actions
  - Interactive mode for all major commands
- **File Storage**: Secure data persistence
  - JSON-based storage with optional encryption
  - Automatic backup file creation
  - Atomic file operations for data safety
- **Error Handling**: Comprehensive error management
  - Typed error registry with specific error codes
  - Result pattern for all operations
  - Graceful error recovery and user feedback

### Features
- **Script Management**: Multi-command scripts with priority
  - Single command (legacy) and multi-command formats
  - Execution modes: same-terminal vs new-terminals
  - Terminal close behavior configuration
  - Priority-based command execution
- **Session Management**: Full development context capture
  - Git state (branch, commit, stash)
  - Terminal commands with execution order
  - File positions and IDE state
  - Project-specific session organization
- **Terminal Collections**: Grouped command execution
  - Multiple scripts in single collection
  - Lifecycle-based execution (open, resume, manual)
  - Sequential command execution
  - Cross-platform terminal support
- **Configuration System**: Flexible settings management
  - IDE preferences and integration settings
  - Logging configuration (console, file, levels)
  - Storage path customization
  - Extension and experimental feature support

### Technical Architecture
- **Monorepo Structure**: Organized package management
  - Core domain logic separation
  - CLI interface independence
  - Shared build system and tooling
- **Type Safety**: Full TypeScript implementation
  - Strict type checking
  - Zod validation schemas
  - Comprehensive type definitions
- **Build System**: ESBuild-based compilation
  - Fast incremental builds
  - TypeScript compilation
  - Source map generation
- **Testing**: Comprehensive test coverage
  - Unit tests for all components
  - Integration tests for workflows
  - Mock implementations for external dependencies

---

## Version Compatibility

### Breaking Changes
- **v1.0.0**: Initial release - no breaking changes
- **v1.0.1**: No breaking changes - Linux terminal support added
- **v1.0.2**: No breaking changes - CLI improvements and bug fixes

### Migration Guide
- **From v1.0.0 to v1.0.1**: No migration required
- **From v1.0.1 to v1.0.2**: No migration required
- **Future versions**: Check this changelog for breaking changes

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 