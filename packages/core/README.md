# @codestate/core

**Version 1.0.11** - Core domain models, services, and infrastructure for CodeState

## 🚀 What's New in v1.0.11

### ✨ **Major New Features**
- **Cross-Platform Terminal Execution Modes**: Intelligent terminal execution based on OS capabilities
  - **Same-Terminal Mode**: Scripts run in tabs within a single terminal (macOS + Windows Terminal)
  - **Multi-Terminal Mode**: Each script runs in separate terminal windows
  - **IDE Mode**: Reserved for IDE extension integration
  - **OS-Aware Execution**: Automatic platform detection and capability-based execution
- **Windows Terminal Support**: Full Windows Terminal (`wt`) integration for tab creation
  - Automatic detection of Windows Terminal availability using `wt --version`
  - Programmatic tab creation using `wt new-tab` commands
  - Support for working directories (`--startingDirectory`) and tab titles (`--title`)
  - Fallback to multi-terminal mode when Windows Terminal unavailable
- **Enhanced macOS Terminal Support**: Improved AppleScript-based tab creation
  - Uses System Events for reliable tab creation in Terminal.app
  - Better error handling and debugging capabilities
  - Comprehensive logging for tab creation process
- **Script Filtering by IDs**: Enhanced script management capabilities
  - `GetScripts` use case now supports filtering by script IDs
  - Efficient individual script fetching for specific ID lists
  - Maintains backward compatibility with existing filtering options

### 🏗️ **Architecture Improvements**
- **OS Detection Service**: New core service for platform detection and capabilities
  - `OSDetectionService` for detecting OS and terminal capabilities
  - `GetOSInfo` use case for CLI consumption
  - Async command execution for Windows Terminal detection
  - Platform-specific capability detection (macOS, Windows, Linux)
- **Terminal Collection Execution Modes**: Enhanced terminal collection management
  - `executionMode` field added to terminal collections (`'ide' | 'same-terminal' | 'multi-terminal'`)
  - Backward compatibility with default `same-terminal` mode
  - Schema validation with proper default values
- **Cross-Platform Terminal Handling**: Unified terminal spawning across platforms
  - macOS: AppleScript System Events for tab creation
  - Windows: Windows Terminal (`wt`) for tab creation
  - Linux: Multi-terminal fallback (no reliable tab support)

### 🔧 **Technical Enhancements**
- **Terminal Command Interface**: Enhanced terminal command structure
  - `closeAfterExecution` flag added to `TerminalCommand` interface
  - Proper terminal spawning method selection based on close behavior
  - Better Linux terminal handling with `-hold` flags
  - `spawnTerminalCommand` method updated to use appropriate spawning method
- **Comprehensive Logging**: Enhanced debugging and monitoring
  - Detailed logging for terminal tab creation processes
  - OS detection logging with capability explanations
  - Windows Terminal command logging with formatted output
  - AppleScript execution logging with error handling
- **Terminal Service Enhancements**: Improved terminal spawning capabilities
  - `spawnWindowsTerminalWithTabs` method for Windows Terminal tab creation
  - Enhanced `spawnTerminalWithTabs` with platform-specific handling
  - Better error handling and fallback mechanisms
  - Support for multiple tab commands with proper formatting

### 🐛 **Bug Fixes**
- **Linux Terminal Issues**: Fixed multi-terminal mode closing automatically despite `closeTerminalAfterExecution: false`
  - Removed forced `exit` from command strings
  - Proper use of `-hold` flags for Linux terminals
  - Updated `spawnTerminalCommand` to use appropriate spawning method
- **Linux Same-Terminal Mode**: Fixed same-terminal mode not creating tabs and only running first script
  - Implemented Linux-specific tab creation logic
  - Support for GNOME Terminal, Konsole, XFCE Terminal, MATE Terminal, and Terminator
  - Proper fallback to sequential execution for unsupported terminals
- **Terminal Collection Execution**: Fixed terminal collection execution issues
  - Proper handling of `closeAfterExecution` flag
  - Better command building without forced exit
  - Enhanced error handling and logging

## 🚀 What's New in v1.0.9

### ✨ **Major New Features**
- **Terminal Collection Update Use Case**: Complete terminal collection management capabilities
  - `UpdateTerminalCollection` use case for modifying existing terminal collections
  - Support for updating name, root path, lifecycle events, script references, and close behavior
  - ID-based operations for better performance and data integrity
- **Enhanced Terminal Collection Use Cases**: Complete use case coverage for terminal collections
  - **New Use Cases**:
    - `GetTerminalCollectionById` - Fetch individual terminal collections by ID
    - `DeleteTerminalCollections` - Delete terminal collections by IDs
  - **Enhanced Use Cases**:
    - `GetTerminalCollections` - Added filtering options (rootPath, lifecycle, loadScripts)
- **Script Lifecycle Integration**: Enhanced script management with lifecycle events
  - Support for 'open', 'resume', and 'none' lifecycle events in script creation
  - Lifecycle filtering for script listing and execution
  - Interactive lifecycle event selection during script creation

### 🏗️ **Architecture Improvements**
- **Complete Use Case Migration**: All terminal collection operations now use proper use cases
  - Better separation of concerns: Use Cases → Services → Repositories
  - Improved type safety with `LifecycleEvent` and `TerminalCollectionWithScripts`
  - Enhanced error handling and validation throughout the use case layer
- **Enhanced Filtering**: Improved filtering capabilities across all use cases
  - Lifecycle-based filtering for both scripts and terminal collections
  - Root path filtering with current directory support
  - Multiple filter combination support for advanced use cases
- **Type Safety**: Proper typing with `LifecycleEvent` and `TerminalCollectionWithScripts`
  - Enhanced TypeScript interfaces for better development experience
  - Comprehensive type guards and validation functions

### 🔧 **Technical Enhancements**
- **Use Case Architecture**: Complete migration from direct service usage to use case pattern
  - All terminal collection operations now use dedicated use cases
  - Better separation of concerns and improved maintainability
  - Enhanced error handling and user feedback
- **Enhanced Error Handling**: Better error handling and user feedback
  - Graceful handling of empty script lists during updates
  - Clear error messages for missing resources
  - Comprehensive validation for user inputs

## 🚀 What's New in v1.0.8

### ✨ **Major New Features**
- **Script Lifecycle Events**: Enhanced script management with lifecycle support
  - Added lifecycle events ('open', 'resume', 'none') to script creation
  - Interactive lifecycle selection during script creation
  - Lifecycle filtering for script listing and execution
  - Updated CLI help text with lifecycle options

## 🚀 What's New in v1.0.6

### ✨ **Major New Features**
- **SessionWithFullData Interface**: New interface extending Session with loaded terminal collections and scripts data
  - `terminalCollectionsData?: TerminalCollectionWithScripts[]` - Complete terminal collections with scripts
  - `scriptsData?: Script[]` - Complete script objects with commands and metadata
  - Proper TypeScript types and type guards for safe data access
- **Enhanced Session Management**: Full data loading capabilities for detailed session views
  - SessionService now integrates with TerminalCollectionService and ScriptService
  - Automatic loading of terminal collections and scripts when `loadAll: true`
  - Backward compatibility with existing Session interface

### 🔧 **Technical Enhancements**
- **Service Integration**: SessionService constructor now accepts TerminalCollectionService and ScriptService
  - Proper dependency injection for data loading
  - Enhanced error handling for failed data loads
  - Graceful fallback when services are unavailable
- **Type Safety**: Comprehensive TypeScript support
  - `SessionWithFullData` interface with proper type guards
  - Updated `ISessionService` interface to support both return types
  - Type-safe data loading and validation

### 📚 **Documentation & Developer Experience**
- **UI Package Schemas**: Complete documentation for building custom UI components
  - `docs/UI_PACKAGE_SCHEMAS.md` with all Session, Script, and TerminalCollection schemas
  - TypeScript interfaces ready for import and use
  - Usage examples and component structure recommendations
  - Validation functions and error handling patterns

## 🚀 What's New in v1.0.5

### ✨ **Major Improvements**
- **Complete UUID Migration**: All entities now use consistent UUID-based file naming
- **Enhanced Windows Terminal Support**: Added detection for Windows Terminal, PowerShell, WSL, Git Bash, and more
- **Improved File Storage Strategy**: Atomic writes with backup files for all data operations
- **Better Linux Terminal Handling**: Resolved terminal spawning conflicts on Linux systems

### 🔧 **Technical Enhancements**
- **Unified File Naming**: `{uuid}.json` format for all entity types
- **Enhanced Terminal Detection**: OS-aware terminal spawning for Windows, macOS, and Linux
- **Robust Error Handling**: Better backup file management and cleanup
- **Performance Improvements**: Direct UUID lookups instead of path-based searches

## 🌟 Core Features

- **Domain Models**: Scripts, Sessions, Terminal Collections, and Configurations
- **Use Cases**: Complete business logic for all CodeState operations
  - **Script Use Cases**: Create, Update, Delete, Get, Export, Import, Resume
  - **Session Use Cases**: Save, Resume, Delete, Export, Import, List, Get
  - **Terminal Collection Use Cases**: Create, Update, Delete, Get, GetById, List, Execute, Export, Import
  - **Config Use Cases**: Get, Update, Reset, Export, Import, CheckVersionUpgrade
  - **Git Use Cases**: Commit, Stash, GetStatus, GetDirtyData, GetCurrentCommit
  - **IDE Use Cases**: OpenIDE, OpenFiles, GetAvailableIDEs
- **Services**: Git management, terminal operations, file storage, and encryption
- **Type Safety**: Full TypeScript support with Zod validation schemas
- **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux
- **Full Data Loading**: Access complete session data with terminal collections and scripts
- **Lifecycle Management**: Script and terminal collection lifecycle events (open, resume, none)
- **Enhanced Filtering**: Advanced filtering capabilities across all use cases
