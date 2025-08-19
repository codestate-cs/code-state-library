# Core Library Updates for IDE Extension Development

This document outlines all the recent updates made to the CodeState core library to support enhanced session management, terminal command capture, and multi-command scripts. This serves as a reference for IDE extension development.

## 📅 **Version Information**

- **Last Updated**: December 2024
- **Core Version**: Latest
- **Breaking Changes**: None (fully backward compatible)

---

## 🎯 **Overview of Changes**

### **1. Enhanced Session Management**
- Added terminal command capture and restoration
- Added file position ordering for proper file opening sequence
- Backward compatible with existing sessions

### **2. Multi-Command Scripts**
- Scripts now support multiple commands with priority ordering
- Backward compatible with single-command scripts

### **3. Improved Type Definitions**
- Updated TypeScript interfaces for better IDE integration
- Enhanced validation schemas

---

## 📋 **Model Changes**

### **1. Session Model Updates**

#### **FileState Interface (Enhanced)**
```typescript
export interface FileState {
  path: string;
  cursor?: { line: number; column: number };
  scroll?: { top: number; left: number };
  isActive: boolean;
  position?: number; // 🆕 NEW: 0-based index for file opening order
}
```

**Usage for IDE Extensions:**
- Use `position` field to determine file opening order (0, 1, 2...)
- If `position` is undefined, maintain original order for backward compatibility
- Sort files by position before opening: `files.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))`

#### **Session Interface (Enhanced)**
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
  terminalCommands?: TerminalCommandState[]; // 🆕 NEW: Terminal commands with metadata
}
```

#### **TerminalCommandState Interface (NEW)**
```typescript
export interface TerminalCommandState {
  terminalId: number;              // Unique terminal identifier (1, 2, 3...)
  terminalName?: string;           // Optional terminal name
  commands: TerminalCommand[];     // Array of commands with priority
}

export interface TerminalCommand {
  command: string;                 // The actual command to execute
  name: string;                    // Human-readable command name
  priority: number;                // Execution order (1, 2, 3...)
}
```

**Usage for IDE Extensions:**
- Sort terminals by `terminalId` for proper order
- Sort commands within each terminal by `priority`
- Use `terminalName` for display purposes in UI

### **2. Script Model Updates**

#### **Script Interface (Enhanced)**
```typescript
export interface Script {
  name: string;
  rootPath: string;
  script?: string;                 // 🚨 DEPRECATED: Single script command (backward compatibility)
  commands?: ScriptCommand[];      // 🆕 NEW: Array of commands with priority
}

export interface ScriptCommand {
  command: string;                 // The actual command to execute
  name: string;                    // Human-readable command name
  priority: number;                // Execution order (1, 2, 3...)
}
```

**Usage for IDE Extensions:**
- Check if `script` exists for legacy single-command scripts
- Use `commands` array for new multi-command scripts
- Sort commands by `priority` before execution
- Display both formats appropriately in UI

---

## 🔄 **Core Service Updates**

### **1. SessionService Enhancements**

#### **Constructor Changes**
```typescript
constructor(repository: SessionRepository, terminalService?: ITerminalService)
```

**Key Changes:**
- Added optional `terminalService` parameter for terminal command capture
- Automatically captures terminal commands during session save if service is available

#### **Save Session Behavior**
```typescript
async saveSession(input: Partial<Session> & { 
  name: string; 
  projectRoot: string; 
  notes?: string; 
  tags?: string[] 
}): Promise<Result<Session>>
```

**New Behavior:**
- Automatically captures terminal commands from current working directory
- Populates `terminalCommands` field if terminal service is available
- Fully backward compatible - no changes needed for existing code

### **2. TerminalService New Methods**

#### **Terminal Command Capture**
```typescript
async getLastCommandsFromTerminals(): Promise<Result<TerminalCommandState[]>>
```

**Functionality:**
- Captures last command from each open terminal in current working directory
- Returns structured data with terminal IDs and command metadata
- Cross-platform support (Windows, macOS, Linux)

**Example Usage:**
```typescript
const terminalService = new TerminalFacade();
const result = await terminalService.getLastCommandsFromTerminals();

if (result.ok) {
  // result.value contains TerminalCommandState[]
  const terminals = result.value;
  terminals.forEach(terminal => {
    console.log(`Terminal ${terminal.terminalId}: ${terminal.terminalName}`);
    terminal.commands.forEach(cmd => {
      console.log(`  ${cmd.priority}. ${cmd.name}: ${cmd.command}`);
    });
  });
}
```

---

## 🎨 **IDE Integration Patterns**

### **1. Session Saving with File Positions**

```typescript
// IDE Extension - Capture current state
const session = {
  name: "Feature Work",
  projectRoot: workspace.rootPath,
  files: openTabs.map((tab, index) => ({
    path: tab.filePath,
    cursor: { line: tab.cursorLine, column: tab.cursorColumn },
    scroll: { top: tab.scrollTop, left: tab.scrollLeft },
    isActive: tab.isActive,
    position: index // 🆕 NEW: File opening order
  })),
  git: gitState,
  notes: "Working on authentication feature",
  tags: ["feature", "auth"]
};

const saveSession = new SaveSession();
const result = await saveSession.execute(session);
```

### **2. Session Resuming with Ordered File Opening**

```typescript
// IDE Extension - Resume session
const resumeSession = new ResumeSession();
const result = await resumeSession.execute(sessionId);

if (result.ok) {
  const session = result.value;
  
  // 🆕 NEW: Sort files by position before opening
  const sortedFiles = [...session.files].sort((a, b) => {
    const posA = a.position ?? Number.MAX_SAFE_INTEGER;
    const posB = b.position ?? Number.MAX_SAFE_INTEGER;
    return posA - posB;
  });
  
  // Open files in correct order
  for (const file of sortedFiles) {
    await vscode.workspace.openTextDocument(file.path);
    // Restore cursor and scroll position
    // Set active tab if file.isActive is true
  }
  
  // 🆕 NEW: Restore terminal commands
  if (session.terminalCommands) {
    const sortedTerminals = [...session.terminalCommands]
      .sort((a, b) => a.terminalId - b.terminalId);
    
    for (const terminalState of sortedTerminals) {
      const sortedCommands = [...terminalState.commands]
        .sort((a, b) => a.priority - b.priority);
      
      for (const cmd of sortedCommands) {
        // Create VS Code terminal and execute command
        const terminal = vscode.window.createTerminal(terminalState.terminalName);
        terminal.sendText(cmd.command);
      }
    }
  }
}
```

### **3. Script Management with Multi-Commands**

```typescript
// IDE Extension - Create multi-command script
const script = {
  name: "Build and Test",
  rootPath: workspace.rootPath,
  commands: [
    { command: "npm install", name: "Install Dependencies", priority: 1 },
    { command: "npm run build", name: "Build Project", priority: 2 },
    { command: "npm test", name: "Run Tests", priority: 3 }
  ]
};

const createScripts = new CreateScripts();
const result = await createScripts.execute([script]);
```

### **4. Script Execution with Priority Order**

```typescript
// IDE Extension - Execute script commands in order
const getScripts = new GetScriptsByRootPath();
const result = await getScripts.execute(workspace.rootPath);

if (result.ok) {
  for (const script of result.value) {
    if (script.commands) {
      // 🆕 NEW: Multi-command script
      const sortedCommands = [...script.commands]
        .sort((a, b) => a.priority - b.priority);
      
      for (const cmd of sortedCommands) {
        const terminal = vscode.window.createTerminal(cmd.name);
        terminal.sendText(cmd.command);
      }
    } else if (script.script) {
      // Legacy single-command script
      const terminal = vscode.window.createTerminal(script.name);
      terminal.sendText(script.script);
    }
  }
}
```

---

## 🔍 **Schema Validation**

### **1. Updated Validation Functions**

```typescript
import { 
  validateSession,
  validateScript,
  validateTerminalCommandState,
  validateScriptCommand 
} from '@codestate/core';

// Validate session data
try {
  const validSession = validateSession(sessionData);
  // Session is valid and properly typed
} catch (error) {
  // Handle validation error
}

// Validate script data
try {
  const validScript = validateScript(scriptData);
  // Script is valid (handles both legacy and new format)
} catch (error) {
  // Handle validation error
}
```

### **2. Type Exports for IDE Extensions**

```typescript
import type {
  Session,
  FileState,
  TerminalCommandState,
  TerminalCommand,
  Script,
  ScriptCommand
} from '@codestate/core';
```

---

## ⚠️ **Migration Guide**

### **Existing IDE Extensions**

#### **No Breaking Changes**
- All existing code continues to work without modifications
- New fields are optional and backward compatible
- Legacy session and script formats are fully supported

#### **Optional Enhancements**
```typescript
// Before (still works)
const session = {
  files: [{ path: "file.ts", isActive: true }]
};

// After (enhanced)
const session = {
  files: [{ 
    path: "file.ts", 
    isActive: true,
    position: 0 // 🆕 NEW: Optional file ordering
  }],
  terminalCommands: [{ // 🆕 NEW: Optional terminal commands
    terminalId: 1,
    terminalName: "Main Terminal",
    commands: [{ command: "npm run dev", name: "Dev Server", priority: 1 }]
  }]
};
```

---

## 🚀 **Best Practices for IDE Extensions**

### **1. File Position Management**
- Always set `position` field when capturing file state
- Use 0-based indexing for consistency
- Sort by position when restoring sessions

### **2. Terminal Command Capture**
- Capture terminal commands only when user explicitly saves session
- Provide UI options to exclude specific terminals
- Store meaningful command names for better UX

### **3. Multi-Command Scripts**
- Provide UI for users to create multi-command scripts
- Allow reordering commands via drag-and-drop
- Show command execution progress with priority indicators

### **4. Error Handling**
```typescript
// Always handle missing optional fields
const files = session.files || [];
const terminalCommands = session.terminalCommands || [];

// Check for both legacy and new script formats
const executeScript = (script: Script) => {
  if (script.commands) {
    // Execute multi-command script
    script.commands
      .sort((a, b) => a.priority - b.priority)
      .forEach(cmd => executeCommand(cmd.command));
  } else if (script.script) {
    // Execute legacy single command
    executeCommand(script.script);
  }
};
```

---

## 📚 **Additional Resources**

### **Core Documentation**
- `docs/API_CONTRACT.md` - Complete API reference
- `docs/ARCHITECTURE_FLOW.md` - Architecture patterns
- `docs/SESSION_IMPLEMENTATION.md` - Session implementation details

### **Examples**
- `packages/cli-interface/` - CLI implementation examples
- `packages/core/use-cases/` - Use case implementations
- `tests/` - Test examples and patterns

---

## 🎉 **Summary**

The core library now provides:

1. **🎯 Enhanced Session Management**: File position ordering and terminal command capture
2. **⚡ Multi-Command Scripts**: Priority-based command execution
3. **🔄 Full Backward Compatibility**: No breaking changes for existing extensions
4. **🔧 Rich Type Support**: Complete TypeScript definitions
5. **✅ Robust Validation**: Schema validation for all new features

IDE extensions can now provide a complete "save game" experience for development workflows, capturing and restoring the entire development environment including file order, terminal commands, and complex script workflows.
