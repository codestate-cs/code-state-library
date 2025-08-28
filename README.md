# CodeState - Development Environment Management Tool

**Version 1.0.5** - A powerful tool for managing development environments, scripts, and sessions with consistent UUID-based storage.

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
- **Cross-Platform Support**: Works seamlessly on Windows, macOS, and Linux
- **UUID-Based Storage**: Consistent, reliable file naming convention across all entities 