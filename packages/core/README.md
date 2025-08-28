# @codestate/core

**Version 1.0.5** - Core domain models, services, and infrastructure for CodeState

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
