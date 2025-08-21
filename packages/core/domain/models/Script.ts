export interface Script {
  name: string;
  rootPath: string;
  script?: string; // DEPRECATED: Single script command (backward compatible)
  commands?: ScriptCommand[]; // NEW: Array of commands with priority (backward compatible)
  lifecycle?: LifecycleEvent[]; // NEW: Optional lifecycle for individual scripts
}

// NEW: Individual command within a script
export interface ScriptCommand {
  command: string;
  name: string;
  priority: number;
}

export interface ScriptIndexEntry {
  rootPath: string;
  referenceFile: string;
}

export interface ScriptIndex {
  entries: ScriptIndexEntry[];
}

export interface ScriptCollection {
  scripts: Script[];
}

// NEW: Lifecycle events for scripts and terminals
export type LifecycleEvent = 'open' | 'resume' | 'none'; 