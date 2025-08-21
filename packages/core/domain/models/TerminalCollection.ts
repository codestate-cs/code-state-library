import { LifecycleEvent, Script } from './Script';

export interface ScriptReference {
  id: string;
  rootPath: string;
}

export interface TerminalCollection {
  id: string;
  name: string;
  rootPath: string;
  lifecycle: LifecycleEvent[];
  scriptReferences: ScriptReference[];
  closeTerminalAfterExecution?: boolean; // NEW: Control whether to close terminal after execution
}

// Interface for terminal collection with loaded scripts (for display/execution)
export interface TerminalCollectionWithScripts {
  id: string;
  name: string;
  rootPath: string;
  lifecycle: LifecycleEvent[];
  scripts: Script[];
  closeTerminalAfterExecution?: boolean;
}

export interface TerminalCollectionIndexEntry {
  id: string;
  name: string;
  rootPath: string;
  referenceFile: string;
}

export interface TerminalCollectionIndex {
  entries: TerminalCollectionIndexEntry[];
}
