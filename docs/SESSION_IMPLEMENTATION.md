# Session Implementation Specification

## 🎯 **Overview**

CodeState Session is the core feature that enables developers to save and resume their entire development context. It acts as a "save game" button for development, capturing the current state and allowing seamless context switching.

## 🏗️ **Architecture**

Following the established `ARCHITECTURE_FLOW.md` pattern:

```
CLI Layer → Command Layer → TUI Handler Layer → CLI API Layer → Use Case Layer → Service Layer → Repository Layer → File System
```

## 📁 **File Structure**

```
packages/
├── cli-api/
│   └── main.ts                          # Export session use cases
├── cli-interface/
│   ├── commands/
│   │   └── session/                     # Session-specific commands
│   │       ├── index.ts                 # Export all session commands
│   │       ├── saveSession.ts           # Save session command
│   │       ├── updateSession.ts         # Update session command
│   │       ├── resumeSession.ts         # Resume session command
│   │       ├── listSessions.ts          # List sessions command
│   │       ├── deleteSession.ts         # Delete session command
│   │       ├── exportSession.ts         # Export session command
│   │       └── importSession.ts         # Import session command
│   └── tui/
│       └── session/
│           ├── index.ts                 # Export TUI functions
│           ├── cliHandler.ts            # CLI command handler
│           ├── saveSessionTui.ts        # Interactive save
│           ├── updateSessionTui.ts      # Interactive update
│           ├── resumeSessionTui.ts      # Interactive resume
│           ├── listSessionsTui.ts       # Interactive list
│           └── deleteSessionTui.ts      # Interactive delete
├── core/
│   ├── domain/
│   │   ├── models/
│   │   │   └── Session.ts               # Session domain models
│   │   ├── ports/
│   │   │   └── ISessionService.ts       # Session service interface
│   │   └── schemas/
│   │       └── SchemaRegistry.ts        # Add session schemas
│   ├── services/
│   │   └── session/
│   │       ├── SessionService.ts        # Business logic
│   │       └── SessionFacade.ts         # Dependency injection
│   └── use-cases/
│       └── session/
│           ├── index.ts                 # Export all use cases
│           ├── SaveSession.ts           # Save use case
│           ├── UpdateSession.ts         # Update use case
│           ├── ResumeSession.ts         # Resume use case
│           ├── ListSessions.ts          # List use case
│           ├── DeleteSession.ts         # Delete use case
│           ├── ExportSession.ts         # Export use case
│           └── ImportSession.ts         # Import use case
└── infrastructure/
    └── repositories/
        └── SessionRepository.ts         # Data persistence
```

## 🧩 **Domain Models**

### **Session.ts**
```typescript
export interface Session {
  id: string;
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  files: FileState[];
  git: GitState;
  extensions?: Record<string, unknown>;
}

export interface FileState {
  path: string;
  cursor?: { line: number; column: number };
  scroll?: { top: number; left: number };
  isActive: boolean;
}

export interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string;
}
```

## 🔄 **Core Use Cases**

### **1. SaveSession**
- **Purpose**: Create new session with current development state
- **Input**: Session name, optional notes and tags
- **Process**:
  1. Check current Git status
  2. If repository is dirty:
     - Show dirty files to user
     - Ask user how to handle changes: [Commit] [Stash] [Cancel]
     - If Commit: Ask for commit message, commit changes, proceed
     - If Stash: Create stash, capture stash ID, proceed
     - If Cancel: Abort operation
  3. Capture current Git state (branch, commit, dirty status, stash ID if applicable)
  4. Capture file state from IDE extension (empty array in CLI)
  5. Ask user for session name, notes, and tags
  6. Generate unique session ID with timestamp
  7. Save session atomically with encryption
  8. Update session index

### **2. UpdateSession**
- **Purpose**: Replace existing session data with current state (same ID and name)
- **Input**: Session ID or name, optional new notes and tags
- **Process**:
  1. Load existing session and validate
  2. Check current Git status
  3. If repository is dirty:
     - Show dirty files to user
     - Ask user how to handle changes: [Commit] [Stash] [Cancel]
     - If Commit: Ask for commit message, commit changes, proceed
     - If Stash: Create stash, capture stash ID, proceed
     - If Cancel: Abort operation
  4. Capture current Git state (branch, commit, dirty status, stash ID if applicable)
  5. Capture file state from IDE extension (empty array in CLI)
  6. Ask user for new notes and tags (pre-populate with existing values)
  7. Update session with new data (keep same ID and name)
  8. Update session index

### **3. ResumeSession**
- **Purpose**: Restore complete development environment
- **Input**: Session ID or name
- **Process**:
  1. Load session file and validate
  2. Check current Git status
  3. If current repository is dirty:
     - Show current changes to user
     - Ask user: "Save current work first?"
     - Options: [Save Current] [Discard Changes] [Cancel]
     - If Save Current: Create new session with current state, then proceed
     - If Discard Changes: Proceed with resume (will overwrite current state)
     - If Cancel: Abort operation
  4. Restore Git state (switch branch, apply stashes if needed)
  5. Restore file state (open files at exact positions - IDE only)
  6. Execute all scripts saved for the `projectRoot`
  7. Update session metadata (last accessed)

### **4. ListSessions**
- **Purpose**: Show all saved sessions with metadata
- **Input**: Optional filters (tags, search terms)
- **Output**: List of sessions with metadata

### **5. DeleteSession**
- **Purpose**: Remove saved sessions
- **Input**: Session ID or name
- **Process**: Remove session file and update index

### **6. ExportSession**
- **Purpose**: Create portable session files
- **Input**: Session ID or name, export path
- **Output**: Portable session file for sharing

### **7. ImportSession**
- **Purpose**: Load sessions from files
- **Input**: Session file path
- **Process**: Validate and import session

## 📁 **File Storage Strategy**

### **Storage Location**
```
~/.codestate/
├── sessions/
│   ├── index.json              # Session metadata index
│   ├── session-{id}.json       # Individual session files
│   └── session-{id}.json.bak   # Backup files
```

### **Session File Format**
```json
{
  "version": "1.0.0",
  "id": "session-1234567890",
  "name": "Feature Implementation",
  "projectRoot": "/path/to/project",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "tags": ["feature", "wip"],
  "notes": "Working on user authentication",
  "files": [
    {
      "path": "src/auth/login.ts",
      "cursor": { "line": 45, "column": 12 },
      "scroll": { "top": 200, "left": 0 },
      "isActive": true
    }
  ],
  "git": {
    "branch": "feature/auth",
    "commit": "abc123",
    "isDirty": false,
    "stashId": null
  },
  "extensions": {}
}
```

### **Index File Format**
```json
{
  "version": "1.0.0",
  "sessions": [
    {
      "id": "session-1234567890",
      "name": "Feature Implementation",
      "projectRoot": "/path/to/project",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "tags": ["feature", "wip"],
      "notes": "Working on user authentication"
    }
  ]
}
```

## 🔄 **Detailed Flow Specifications**

### **Save Session Flow**
```
1. Check current Git status
2. If repository is dirty:
   - Show dirty files to user
   - Ask user how to handle changes: [Commit] [Stash] [Cancel]
   - If Commit: Ask for commit message, commit changes, proceed
   - If Stash: Create stash, capture stash ID, proceed
   - If Cancel: Abort operation
3. Capture current Git state (branch, commit, dirty status, stash ID if applicable)
4. Capture file state from IDE extension (empty array in CLI)
5. Ask user for session name, notes, and tags
6. Generate unique session ID with timestamp
7. Save session atomically with encryption
8. Update session index
```

### **Update Session Flow**
```
1. Load existing session and validate
2. Check current Git status
3. If repository is dirty:
   - Show dirty files to user
   - Ask user how to handle changes: [Commit] [Stash] [Cancel]
   - If Commit: Ask for commit message, commit changes, proceed
   - If Stash: Create stash, capture stash ID, proceed
   - If Cancel: Abort operation
4. Capture current Git state (branch, commit, dirty status, stash ID if applicable)
5. Capture file state from IDE extension (empty array in CLI)
6. Ask user for new notes and tags (pre-populate with existing values)
7. Update session with new data (keep same ID and name)
8. Update session index
```

### **Resume Session Flow**
```
1. Load session file and validate
2. Check current Git status
3. If current repository is dirty:
   - Show current changes to user
   - Ask user: "Save current work first?"
   - Options: [Save Current] [Discard Changes] [Cancel]
   - If Save Current: Create new session with current state, then proceed
   - If Discard Changes: Proceed with resume (will overwrite current state)
   - If Cancel: Abort operation
4. Restore Git state (switch branch, apply stashes if needed)
5. Restore file state (open files at exact positions - IDE only)
6. Execute all scripts saved for the `projectRoot`
7. Update session metadata (last accessed)
```

### **Key Design Decisions**
- **Session Name Immutability**: Session names cannot be changed during update to prevent confusion
- **Git State Consistency**: Save and Update use identical git state capture logic
- **File State Capture**: Always capture file state when extensions are available
- **User Choice**: Always give users control over how to handle dirty states
- **Atomic Operations**: All session operations are atomic to prevent data corruption

## 🔗 **Integration Points**

### **Git Service Integration**
- **SaveSession**: Capture current branch, commit, dirty status
- **UpdateSession**: Capture current branch, commit, dirty status (same logic as Save)
- **ResumeSession**: Switch to branch, apply stashes if needed
- **Dirty Handling**: If repository is dirty, prompt user for commit/stash/cancel

### **Script Service Integration**
- **ResumeSession**: Automatically execute all scripts for the `projectRoot`
- **Script Lookup**: Use `ScriptService.getScriptsByRootPath(projectRoot)`
- **Script Execution**: Use `TerminalService.executeBatch(scripts)`

### **IDE Extension Integration**
- **File State Capture**: IDE extensions populate the `files` array
- **File State Restoration**: IDE extensions restore file positions
- **CLI Behavior**: `files` array is empty in CLI mode

## 🖥️ **CLI Commands**

### **Command Structure**
```bash
codestate session <subcommand> [options]
```

### **Available Commands**
- `codestate session save <name> [--notes="..."] [--tags="tag1,tag2"]`
- `codestate session update <id|name> [--notes="..."] [--tags="tag1,tag2"]`
- `codestate session resume <id|name>`
- `codestate session list [--tags="tag1,tag2"] [--search="term"]`
- `codestate session delete <id|name>`
- `codestate session export <id|name> [--output="path"]`
- `codestate session import <file>`

### **Examples**
```bash
# Save current session
codestate session save "WIP Feature" --notes="Working on auth" --tags="feature,wip"

# Update existing session
codestate session update "WIP Feature" --notes="Updated auth implementation" --tags="feature,wip,updated"

# Resume a session
codestate session resume "WIP Feature"

# List all sessions
codestate session list

# List sessions with specific tags
codestate session list --tags="feature"

# Export session for sharing
codestate session export "WIP Feature" --output="session.json"

# Import session from file
codestate session import "session.json"
```

## 🔧 **Technical Requirements**

### **Atomic Operations**
- Use temp files + rename for atomic writes
- Backup files before destructive operations
- Handle partial failures gracefully

### **Encryption Support**
- Optional AES-256-GCM encryption for sensitive data
- Key management via config service
- Graceful decryption failure handling

### **Validation**
- Zod schema validation at every layer
- Input sanitization and path validation
- Type safety with TypeScript

### **Error Handling**
- Structured error types for session operations
- Comprehensive logging with sensitive data sanitization
- User-friendly error messages
- Proper exit codes

### **Cross-platform Support**
- POSIX path normalization for internal storage
- OS-specific path handling for file operations
- Case sensitivity handling for different OS

### **Performance**
- Index-based O(1) lookups for session metadata
- Lazy loading for large session files
- Efficient batch operations

## 🧪 **Testing Requirements**

### **Unit Tests**
- All use cases with mocked dependencies
- Repository layer with file system mocks
- Service layer with mocked repositories
- Validation schemas with various inputs

### **Integration Tests**
- End-to-end session save/resume flow
- Script integration testing
- Git integration testing
- File system operations testing

### **Test Scenarios**
- Happy path: Save and resume session
- Error scenarios: Corrupt files, missing data
- Edge cases: Empty sessions, large file lists
- Security: Malicious input, path traversal attempts

## 🚀 **Future Enhancements**

### **Phase 2 Features**
- **Session Templates**: Reusable session configurations
- **Session Analytics**: Usage patterns and insights
- **Advanced Search**: Full-text search across session content
- **Session Sharing**: Team collaboration features

### **IDE Integration**
- **VS Code Extension**: File state capture and restoration
- **Cursor Extension**: Enhanced IDE integration
- **WebStorm Extension**: JetBrains IDE support

### **Advanced Features**
- **Session Branching**: Create variations of sessions
- **Session Merging**: Combine multiple sessions
- **Session Scheduling**: Auto-save and resume features
- **Cloud Sync**: Remote session storage and sharing

## 📋 **Implementation Checklist**

### **Phase 1: Core Implementation**
- [ ] Domain models and interfaces
- [ ] Zod schemas for validation
- [ ] Session repository with atomic operations
- [ ] Session service and facade
- [ ] Core use cases (Save, Update, Resume, List, Delete)
- [ ] CLI commands and TUI handlers
- [ ] Integration with Git and Script services
- [ ] Comprehensive error handling
- [ ] Unit and integration tests

### **Phase 2: Advanced Features**
- [ ] Export/Import functionality
- [ ] Search and filtering
- [ ] Session templates
- [ ] Performance optimizations
- [ ] Advanced CLI features

### **Phase 3: IDE Integration**
- [ ] IDE extension development
- [ ] File state capture and restoration
- [ ] Enhanced user experience
- [ ] Cross-platform testing

## 🎯 **Success Criteria**

1. **Functionality**: Users can save and resume development sessions seamlessly
2. **Performance**: Session operations complete within acceptable time limits
3. **Reliability**: Atomic operations prevent data corruption
4. **Security**: Sensitive data is properly encrypted and validated
5. **Usability**: CLI commands are intuitive and well-documented
6. **Integration**: Works seamlessly with existing Git and Script services
7. **Extensibility**: Architecture supports future enhancements and IDE integration

---

**This document serves as the definitive specification for the Session implementation. All development should follow this specification and the established architecture patterns.** 