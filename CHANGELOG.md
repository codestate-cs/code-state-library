# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-01-29

### ✨ **Major New Features**
- **SessionWithFullData Interface**: New interface extending Session with loaded terminal collections and scripts data
  - `terminalCollectionsData?: TerminalCollectionWithScripts[]` - Complete terminal collections with scripts
  - `scriptsData?: Script[]` - Complete script objects with commands and metadata
  - Proper TypeScript types and type guards for safe data access
- **Comprehensive CLI Filtering**: Advanced filtering options for sessions list command
  - `--root-path <path>` - Filter sessions by project root path
  - `--tags <tags>` - Filter by comma-separated tags (e.g., `--tags "feature,development"`)
  - `--search <term>` - Search in session names and notes
  - `--showAll` - Display full session data including terminal collections and scripts
  - Support for combining multiple filters (e.g., `--showAll --tags "feature"`)
- **Enhanced Session Management**: Full data loading capabilities for detailed session views
  - SessionService now integrates with TerminalCollectionService and ScriptService
  - Automatic loading of terminal collections and scripts when `loadAll: true`
  - Backward compatibility with existing Session interface

### 🔧 **Technical Enhancements**
- **Service Integration**: SessionService constructor now accepts TerminalCollectionService and ScriptService
  - Proper dependency injection for data loading
  - Enhanced error handling for failed data loads
  - Graceful fallback when services are unavailable
- **Advanced CLI Arguments**: Robust argument parsing similar to scripts CLI
  - Proper validation for required argument values
  - Support for multiple argument combinations
  - Enhanced error messages for invalid usage
- **Type Safety**: Comprehensive TypeScript support
  - `SessionWithFullData` interface with proper type guards
  - Updated `ISessionService` interface to support both return types
  - Type-safe CLI argument handling

### 📚 **Documentation & Developer Experience**
- **UI Package Schemas**: Complete documentation for building custom UI components
  - `docs/UI_PACKAGE_SCHEMAS.md` with all Session, Script, and TerminalCollection schemas
  - TypeScript interfaces ready for import and use
  - Usage examples and component structure recommendations
  - Validation functions and error handling patterns
- **CLI Help System**: Enhanced help with detailed examples
  - Comprehensive help for all session subcommands
  - Detailed examples for filtering and data loading
  - Clear usage patterns and best practices
- **Session Terminal Restoration**: Improved terminal command restoration
  - Uses terminal service methods instead of manual spawning
  - Better error handling and timeout management
  - Consistent with TerminalCollectionService patterns

### 🐛 **Bug Fixes**
- **Session Data Loading**: Fixed issues with incomplete session data loading
- **CLI Argument Parsing**: Improved argument validation and error handling
- **Type Safety**: Resolved TypeScript errors in SessionWithFullData usage

## [1.0.5] - 2025-01-29

### ✨ **Major Improvements**
- **Complete UUID Migration**: All entities (scripts, terminal collections, sessions) now use consistent UUID-based file naming
  - Scripts: `scripts/{uuid}.json` instead of `scripts/script-{name}-{rootPath}.json`
  - Terminal Collections: `terminals/{uuid}.json` instead of `terminals/terminal-{name}-{rootPath}.json`
  - Sessions: `sessions/{uuid}.json` instead of `sessions/session-{timestamp}-{random}.json`
- **Enhanced Windows Terminal Support**: Added detection for Windows Terminal, PowerShell, WSL, Git Bash, and more
  - Windows Terminal (`wt.exe`) with proper tab management
  - PowerShell with enhanced command execution
  - WSL integration for Linux-like experience
  - Git Bash and MinTTY support
- **Improved File Storage Strategy**: Atomic writes with backup files for all data operations
  - Automatic `.bak` file creation for all write operations
  - Backup file cleanup during deletion operations
  - Enhanced data integrity and recovery

### 🔧 **Technical Enhancements**
- **Unified File Naming**: Consistent `{uuid}.json` format across all entity types
- **Enhanced Terminal Detection**: OS-aware terminal spawning for Windows, macOS, and Linux
  - Linux: gnome-terminal, xterm, konsole, xfce4-terminal, mate-terminal, tilix, terminator, alacritty, kitty
  - Windows: Windows Terminal, PowerShell, WSL, Git Bash, MinTTY, Command Prompt
  - macOS: Terminal.app with proper working directory support
- **Robust Error Handling**: Better backup file management and cleanup
- **Performance Improvements**: Direct UUID lookups instead of path-based searches
- **Repository Layer Updates**: All repositories now use UUID-based operations
  - `deleteById()` methods for efficient deletion
  - Enhanced index management with UUID references
  - Better data consistency and integrity

### 🐛 **Bug Fixes**
- **Linux Terminal Conflicts**: Resolved "same terminal" execution conflicts on Linux systems
- **File Naming Inconsistencies**: Eliminated path-dependent file naming that caused brittleness
- **Backup File Management**: Proper cleanup of backup files during deletion operations
- **Session ID Generation**: Fixed timestamp-based session IDs to use proper UUIDs

### 📚 **Documentation Updates**
- Updated all README files to reflect v1.0.5 features
- Enhanced CLI usage examples and command reference
- Added comprehensive feature documentation for UUID migration
- Updated technical architecture documentation

## [1.0.4] - 2025-01-28

### ✨ **New Features**
- **Enhanced Session Updates**: Session update command now supports terminal collections and scripts
- **Complete Feature Parity**: Update sessions with the same comprehensive options as creating new sessions
- **Improved User Experience**: Better session management workflow with consistent create/update operations

### 🔧 **Improvements**
- **Session Update Interface**: `ISessionService.updateSession` now supports all session fields
- **Terminal Collection Integration**: Sessions can now include terminal collection references
- **Script Integration**: Sessions can now include individual script references
- **Better CLI Feedback**: Enhanced visual feedback during session operations

## [1.0.3] - 2025-01-27

### ✨ **New Features**
- **Script ID References**: Terminal collections now use actual script UUIDs instead of names
- **Enhanced Data Integrity**: Proper script linking using stable identifiers
- **Future-Proofing**: Script name changes won't break existing terminal collections

### 🔧 **Improvements**
- **Script Lookup Logic**: Fixed script finding logic in all TerminalCollectionService methods
- **Schema Compliance**: Proper adherence to ScriptReferenceSchema requirements
- **Performance**: Eliminated unnecessary name-based script searches

## [1.0.2] - 2025-01-26

### ✨ **New Features**
- **Automatic Index Management**: All repositories now create missing index files automatically
- **Enhanced Backup System**: Comprehensive backup file creation for all operations
- **Data Consistency**: Proper synchronization between data files and indexes

### 🔧 **Improvements**
- **TerminalCollectionRepository**: Automatic `index.json` creation when missing
- **ScriptRepository**: Enhanced index management with proper cleanup
- **File Storage**: Enhanced backup and safety with atomic operations

## [1.0.1] - 2025-01-25

### ✨ **New Features**
- **Terminal Collection Management**: Create, manage, and delete terminal collections
- **Enhanced Script Management**: Better script creation and management workflows
- **Improved Error Handling**: More robust error handling and user feedback

### 🔧 **Improvements**
- **CLI Interface**: Enhanced command-line interface with better user experience
- **Data Validation**: Improved data validation and error reporting
- **Performance**: Better performance for large datasets

## [1.0.0] - 2025-01-24

### 🎉 **Initial Release**
- **Core Functionality**: Script management, session management, and configuration
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **CLI Interface**: Comprehensive command-line interface with interactive prompts
- **Type Safety**: Full TypeScript support with comprehensive type definitions

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