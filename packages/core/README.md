# @codestate/core

**Version 1.0.6** - Core domain models, services, and infrastructure for CodeState

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
- **Use Cases**: Business logic for all CodeState operations
- **Services**: Git management, terminal operations, file storage, and encryption
- **Type Safety**: Full TypeScript support with Zod validation schemas
- **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux
- **Full Data Loading**: Access complete session data with terminal collections and scripts
