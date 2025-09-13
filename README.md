# CodeState - Development Environment Management Tool

**Version 1.0.7** - A powerful tool for managing development environments, scripts, and sessions with enhanced data loading and comprehensive CLI filtering.

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
- **Terminal Collections**: Group multiple scripts together for complex workflows
- **Session Management**: Save and resume complete development contexts including Git state
- **Advanced Filtering**: Filter sessions by project path, tags, search terms, and load full data
- **Cross-Platform Support**: Works seamlessly on Windows, macOS, and Linux
- **UUID-Based Storage**: Consistent, reliable file naming convention across all entities
- **Full Data Loading**: Access complete session data with terminal collections and scripts 