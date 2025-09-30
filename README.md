# CodeState - Development Environment Management Tool

**Version 1.0.11** - A powerful tool for managing development environments, scripts, and sessions with cross-platform terminal execution modes and intelligent OS detection.

## 🚀 What's New in v1.0.10

### ✨ **Major New Features**
- **Cross-Platform Terminal Execution Modes**: Intelligent terminal execution based on OS capabilities
  - **Same-Terminal Mode**: Scripts run in tabs within a single terminal (macOS + Windows Terminal)
  - **Multi-Terminal Mode**: Each script runs in separate terminal windows
  - **IDE Mode**: Reserved for IDE extension integration
  - **OS-Aware CLI**: Automatically shows/hides options based on platform capabilities
- **Windows Terminal Support**: Full Windows Terminal (`wt`) integration for tab creation
  - Automatic detection of Windows Terminal availability
  - Programmatic tab creation using `wt new-tab` commands
  - Support for working directories and tab titles
  - Fallback to multi-terminal mode when Windows Terminal unavailable
- **Enhanced macOS Terminal Support**: Improved AppleScript-based tab creation
  - Uses System Events for reliable tab creation in Terminal.app
  - Better error handling and debugging capabilities
  - Comprehensive logging for tab creation process

### 🏗️ **Architecture Improvements**
- **OS Detection Service**: New core service for platform detection and capabilities
  - `OSDetectionService` for detecting OS and terminal capabilities
  - `GetOSInfo` use case for CLI consumption
  - Async command execution for Windows Terminal detection
- **Terminal Collection Execution Modes**: Enhanced terminal collection management
  - `executionMode` field added to terminal collections
  - Backward compatibility with default `same-terminal` mode
  - CLI commands updated to show OS-appropriate options
- **Cross-Platform Terminal Handling**: Unified terminal spawning across platforms
  - macOS: AppleScript System Events for tab creation
  - Windows: Windows Terminal (`wt`) for tab creation
  - Linux: Multi-terminal fallback (no reliable tab support)

### 🔧 **Technical Enhancements**
- **Script Filtering by IDs**: Enhanced script management capabilities
  - `GetScripts` use case now supports filtering by script IDs
  - Efficient individual script fetching for specific ID lists
  - Maintains backward compatibility with existing filtering options
- **Terminal Command Interface**: Enhanced terminal command structure
  - `closeAfterExecution` flag added to `TerminalCommand` interface
  - Proper terminal spawning method selection based on close behavior
  - Better Linux terminal handling with `-hold` flags
- **Comprehensive Logging**: Enhanced debugging and monitoring
  - Detailed logging for terminal tab creation processes
  - OS detection logging with capability explanations
  - Windows Terminal command logging with formatted output

## 🚀 What's New in v1.0.9

### ✨ **Major New Features**
- **Terminal Collection Update**: Complete terminal collection management capabilities
  - Interactive CLI command: `codestate terminals update [name]`
  - Support for updating name, root path, lifecycle events, script references, and close behavior
  - Name-to-ID resolution with automatic handling of multiple matches
  - Comprehensive field selection with current value display and validation
- **Enhanced Architecture**: Complete migration to use case-based architecture
  - All terminal collection operations now use proper use cases instead of direct service calls
  - Better separation of concerns: CLI/TUI → Use Cases → Services → Repositories
  - Improved type safety with proper TypeScript interfaces
- **Script Lifecycle Integration**: Enhanced script creation with lifecycle events
  - Interactive lifecycle event selection ('open', 'resume', 'none') during script creation
  - Lifecycle filtering for script listing and execution commands

### 🏗️ **Architecture Improvements**
- **Terminal Collection Use Cases**: Complete migration from direct service usage
  - New use cases: `GetTerminalCollectionById`, `DeleteTerminalCollections`
  - Enhanced use cases: `GetTerminalCollections` with filtering options
  - All CLI commands now use proper use case architecture
- **Type Safety**: Proper typing with `LifecycleEvent` and `TerminalCollectionWithScripts`
- **Error Handling**: Better error handling and user feedback across all operations

## 🚀 What's New in v1.0.8

### ✨ **Major New Features**
- **Script Lifecycle Events**: Enhanced script management with lifecycle support
  - Interactive lifecycle event selection during script creation
  - Lifecycle filtering for script listing and execution
  - Support for 'open', 'resume', and 'none' lifecycle events

## 🚀 What's New in v1.0.7

### 🐛 **Bug Fixes**
- **Fixed Double Execution Issue**: Resolved session resume executing terminals and scripts twice
- **Fixed Commit Changes Flow**: Improved commit handling during session resume with proper user prompts
- **Fixed Package Build Issues**: Resolved deprecation warnings and build configuration

### 🔧 **Architecture Improvements**
- **Use Case Separation**: Better separation of concerns with `GetSession` and `ResumeSession` use cases
- **Git Service Integration**: Proper use of existing git service methods instead of manual commands
- **Cleaner CLI Structure**: Improved command structure with proper use case usage

## 🚀 What's New in v1.0.6

### ✨ **Major New Features**
- **SessionWithFullData**: Load complete session data including terminal collections and scripts
- **Comprehensive CLI Filtering**: Advanced filtering options for sessions with `--root-path`, `--tags`, `--search`, and `--showAll`
- **Enhanced Session Management**: Full data loading capabilities for detailed session views
- **UI Package Documentation**: Complete schema documentation for building custom UI components

### 🔧 **Technical Enhancements**
- **SessionWithFullData Interface**: Extends Session with loaded terminal collections and scripts data
- **Service Integration**: SessionService now integrates with TerminalCollectionService and ScriptService
- **Advanced CLI Arguments**: Support for combining multiple filters and search options
- **Type Safety**: Proper TypeScript types and type guards for SessionWithFullData

### 📚 **Documentation & Developer Experience**
- **UI Package Schemas**: Comprehensive documentation for building dumb UI components
- **CLI Help System**: Enhanced help with detailed examples and usage patterns
- **Session Terminal Restoration**: Improved terminal command restoration using service methods

## 🚀 What's New in v1.0.5

### ✨ **Major Improvements**
- **Complete UUID Migration**: All entities (scripts, terminal collections, sessions) now use consistent UUID-based file naming
- **Enhanced Windows Terminal Support**: Added detection for Windows Terminal, PowerShell, WSL, Git Bash, and more
- **Improved File Storage Strategy**: Atomic writes with backup files for all data operations
- **Better Linux Terminal Handling**: Resolved terminal spawning conflicts on Linux systems

### 🔧 **Technical Enhancements**
- **Unified File Naming**: `{uuid}.json` format for all entity types
- **Enhanced Terminal Detection**: OS-aware terminal spawning for Windows, macOS, and Linux
- **Robust Error Handling**: Better backup file management and cleanup
- **Performance Improvements**: Direct UUID lookups instead of path-based searches

## 🌟 Key Features

- **Script Management**: Create, save, and execute development scripts with priority-based execution
- **Terminal Collections**: Group multiple scripts together for complex workflows with intelligent execution modes
- **Cross-Platform Terminal Support**: OS-aware terminal execution with tab support on macOS and Windows Terminal
- **Session Management**: Save and resume complete development contexts including Git state
- **Advanced Filtering**: Filter sessions by project path, tags, search terms, and load full data
- **OS Detection**: Automatic platform detection with capability-based feature availability
- **UUID-Based Storage**: Consistent, reliable file naming convention across all entities
- **Full Data Loading**: Access complete session data with terminal collections and scripts
- **Windows Terminal Integration**: Full support for Windows Terminal (`wt`) with programmatic tab creation
- **macOS Terminal Enhancement**: Improved AppleScript-based tab creation using System Events 