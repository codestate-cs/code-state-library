# @codestate/core

**Version 1.0.9** - Core domain models, services, and infrastructure for CodeState

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
