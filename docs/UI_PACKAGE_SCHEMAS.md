# CodeState UI Package Schemas

This document contains all the schemas for Sessions, Scripts, and Terminal Collections extracted from the CodeState core SchemaRegistry. Use these schemas to create a dumb UI package that receives data and callback functions.

## Table of Contents

- [Scripts](#scripts)
- [Sessions](#sessions)
- [Terminal Collections](#terminal-collections)
- [Common Types](#common-types)
- [Usage Examples](#usage-examples)

---

## Scripts

### Script Schema
```typescript
interface Script {
  id: string;                    // UUID
  name: string;                  // Required, min 1 character
  rootPath: string;              // Required, min 1 character
  script?: string;               // DEPRECATED: Legacy single script command
  commands?: ScriptCommand[];    // NEW: Array of commands with priority
  lifecycle?: LifecycleEvent[];  // Optional lifecycle events
  executionMode?: 'same-terminal' | 'new-terminals';  // Default: 'same-terminal'
  closeTerminalAfterExecution?: boolean;  // Default: false
}
```

**Validation Rules:**
- Either `script` OR `commands` array must be provided
- `commands` array must have at least one command if provided

### ScriptCommand Schema
```typescript
interface ScriptCommand {
  command: string;    // Required, min 1 character
  name: string;       // Required, min 1 character
  priority: number;   // Required, non-negative integer
}
```

### ScriptCollection Schema
```typescript
interface ScriptCollection {
  scripts: Script[];
}
```

### ScriptIndexEntry Schema
```typescript
interface ScriptIndexEntry {
  id: string;           // UUID
  rootPath: string;     // Required, min 1 character
  referenceFile: string; // Required, min 1 character
}
```

### ScriptIndex Schema
```typescript
interface ScriptIndex {
  entries: ScriptIndexEntry[];
}
```

### ScriptReference Schema
```typescript
interface ScriptReference {
  id: string;       // Required, min 1 character
  rootPath: string; // Required, min 1 character
}
```

---

## Sessions

### Session Schema
```typescript
interface Session {
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
  terminalCommands?: TerminalCommandState[];  // NEW: Terminal commands
  terminalCollections?: string[];            // NEW: Terminal collection IDs
  scripts?: string[];                        // NEW: Individual script IDs
}
```

### SessionWithFullData Schema
```typescript
interface SessionWithFullData extends Session {
  terminalCollectionsData?: TerminalCollectionWithScripts[];
  scriptsData?: Script[];
}
```

### FileState Schema
```typescript
interface FileState {
  path: string;
  cursor?: {
    line: number;
    column: number;
  };
  scroll?: {
    top: number;
    left: number;
  };
  isActive: boolean;
  position?: number;  // NEW: Backward compatible
}
```

### GitState Schema
```typescript
interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}
```

### SessionTerminalCommand Schema
```typescript
interface SessionTerminalCommand {
  command: string;    // Required, min 1 character
  name: string;       // Required, min 1 character
  priority: number;   // Required, non-negative integer
}
```

### TerminalCommandState Schema
```typescript
interface TerminalCommandState {
  terminalId: number;
  terminalName?: string;
  commands: SessionTerminalCommand[];
}
```

### SessionIndexEntry Schema
```typescript
interface SessionIndexEntry {
  id: string;
  name: string;
  projectRoot: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  notes?: string;
  referenceFile: string;
}
```

### SessionIndex Schema
```typescript
interface SessionIndex {
  version: string;
  sessions: SessionIndexEntry[];
}
```

---

## Terminal Collections

### TerminalCollection Schema
```typescript
interface TerminalCollection {
  id: string;                                    // UUID
  name: string;                                  // Required, min 1 character
  rootPath: string;                              // Required, min 1 character
  lifecycle: LifecycleEvent[];                   // Required, min 1 lifecycle event
  scriptReferences: ScriptReference[];           // Required, min 1 script reference
  closeTerminalAfterExecution?: boolean;         // Default: false
}
```

### TerminalCollectionIndexEntry Schema
```typescript
interface TerminalCollectionIndexEntry {
  id: string;           // UUID
  name: string;         // Required, min 1 character
  rootPath: string;     // Required, min 1 character
  referenceFile: string; // Required, min 1 character
}
```

### TerminalCollectionIndex Schema
```typescript
interface TerminalCollectionIndex {
  entries: TerminalCollectionIndexEntry[];
}
```

---

## Common Types

### LifecycleEvent
```typescript
type LifecycleEvent = 'open' | 'resume' | 'none';
```

**Values:**
- `open` - Scripts/terminals with open lifecycle events
- `resume` - Scripts/terminals with resume lifecycle events  
- `none` - Scripts/terminals with no lifecycle events

### TerminalCommand
```typescript
interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}
```

### TerminalResult
```typescript
interface TerminalResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}
```

### TerminalOptions
```typescript
interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string;
}
```

---

## Usage Examples

### Creating a Script
```typescript
const newScript: Script = {
  id: "uuid-here",
  name: "Build and Test",
  rootPath: "/path/to/project",
  commands: [
    {
      command: "npm install",
      name: "Install Dependencies",
      priority: 1
    },
    {
      command: "npm run build",
      name: "Build Project",
      priority: 2
    },
    {
      command: "npm test",
      name: "Run Tests",
      priority: 3
    }
  ],
  lifecycle: ["resume"],
  executionMode: "new-terminals",
  closeTerminalAfterExecution: false
};
```

### Creating a Session
```typescript
const newSession: Session = {
  id: "session-uuid",
  name: "Feature Development",
  projectRoot: "/path/to/project",
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ["feature", "development"],
  notes: "Working on new user authentication feature",
  files: [
    {
      path: "/path/to/project/src/auth.ts",
      cursor: { line: 15, column: 8 },
      scroll: { top: 0, left: 0 },
      isActive: true,
      position: 1
    }
  ],
  git: {
    branch: "feature/auth",
    commit: "abc123",
    isDirty: true,
    stashId: null
  },
  terminalCommands: [
    {
      terminalId: 1,
      terminalName: "Main Terminal",
      commands: [
        {
          command: "npm run dev",
          name: "Start Dev Server",
          priority: 1
        }
      ]
    }
  ]
};
```

### Session with Full Data (loadAll: true)
```typescript
const sessionWithFullData: SessionWithFullData = {
  id: "session-uuid",
  name: "Feature Development",
  projectRoot: "/path/to/project",
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ["feature", "development"],
  notes: "Working on new user authentication feature",
  files: [
    {
      path: "/path/to/project/src/auth.ts",
      cursor: { line: 15, column: 8 },
      scroll: { top: 0, left: 0 },
      isActive: true,
      position: 1
    }
  ],
  git: {
    branch: "feature/auth",
    commit: "abc123",
    isDirty: true,
    stashId: null
  },
  terminalCommands: [
    {
      terminalId: 1,
      terminalName: "Main Terminal",
      commands: [
        {
          command: "npm run dev",
          name: "Start Dev Server",
          priority: 1
        }
      ]
    }
  ],
  terminalCollections: ["terminal-collection-uuid"],
  scripts: ["script-uuid"],
  terminalCollectionsData: [
    {
      id: "terminal-collection-uuid",
      name: "Project Setup",
      rootPath: "/path/to/project",
      lifecycle: ["open"],
      scriptReferences: [
        {
          id: "script-uuid",
          rootPath: "/path/to/project"
        }
      ],
      closeTerminalAfterExecution: true,
      scripts: [
        {
          id: "script-uuid",
          name: "Build and Test",
          rootPath: "/path/to/project",
          commands: [
            {
              command: "npm install",
              name: "Install Dependencies",
              priority: 1
            },
            {
              command: "npm run build",
              name: "Build Project",
              priority: 2
            }
          ],
          lifecycle: ["resume"],
          executionMode: "new-terminals"
        }
      ]
    }
  ],
  scriptsData: [
    {
      id: "script-uuid",
      name: "Build and Test",
      rootPath: "/path/to/project",
      commands: [
        {
          command: "npm install",
          name: "Install Dependencies",
          priority: 1
        },
        {
          command: "npm run build",
          name: "Build Project",
          priority: 2
        }
      ],
      lifecycle: ["resume"],
      executionMode: "new-terminals"
    }
  ]
};
```

### Creating a Terminal Collection
```typescript
const newTerminalCollection: TerminalCollection = {
  id: "terminal-collection-uuid",
  name: "Project Setup",
  rootPath: "/path/to/project",
  lifecycle: ["open"],
  scriptReferences: [
    {
      id: "script-uuid",
      rootPath: "/path/to/project"
    }
  ],
  closeTerminalAfterExecution: true
};
```

---

## Validation Functions

The core package provides validation functions for each schema:

```typescript
import { 
  validateScript,
  validateSession,
  validateTerminalCollection,
  validateScriptCommand,
  validateSessionTerminalCommand,
  validateTerminalCommandState
} from '@codestate/core';

// Validate data before passing to UI
const validatedScript = validateScript(rawData);
const validatedSession = validateSession(rawData);
const validatedTerminalCollection = validateTerminalCollection(rawData);
```

---

## UI Package Structure Recommendation

```typescript
// ui-package/src/types/index.ts
export type { 
  Script, 
  Session, 
  SessionWithFullData,
  TerminalCollection,
  TerminalCollectionWithScripts,
  ScriptCommand,
  SessionTerminalCommand,
  TerminalCommandState,
  FileState,
  GitState,
  LifecycleEvent
} from '@codestate/core';

// ui-package/src/components/ScriptList.tsx
interface ScriptListProps {
  scripts: Script[];
  onScriptSelect: (script: Script) => void;
  onScriptEdit: (script: Script) => void;
  onScriptDelete: (scriptId: string) => void;
}

// ui-package/src/components/SessionList.tsx
interface SessionListProps {
  sessions: Session[];
  onSessionResume: (session: Session) => void;
  onSessionEdit: (session: Session) => void;
  onSessionDelete: (sessionId: string) => void;
}

// ui-package/src/components/SessionDetail.tsx
interface SessionDetailProps {
  session: SessionWithFullData;
  onSessionResume: (session: SessionWithFullData) => void;
  onSessionEdit: (session: SessionWithFullData) => void;
  onSessionDelete: (sessionId: string) => void;
  onScriptSelect: (script: Script) => void;
  onTerminalCollectionSelect: (collection: TerminalCollectionWithScripts) => void;
}

// ui-package/src/components/TerminalCollectionList.tsx
interface TerminalCollectionListProps {
  collections: TerminalCollection[];
  onCollectionExecute: (collection: TerminalCollection) => void;
  onCollectionEdit: (collection: TerminalCollection) => void;
  onCollectionDelete: (collectionId: string) => void;
}
```

This structure allows your UI package to be completely dumb - it just receives data and calls callback functions, while the parent application handles all the business logic and data management. 