import { LifecycleEvent, Script } from './Script';

export interface ScriptReference {
  id: string;
  rootPath: string;
}

export interface TerminalCollection {
  name: string;
  rootPath: string;
  lifecycle: LifecycleEvent[];
  scriptReferences: ScriptReference[];
}

// Interface for terminal collection with loaded scripts (for display/execution)
export interface TerminalCollectionWithScripts {
  name: string;
  rootPath: string;
  lifecycle: LifecycleEvent[];
  scripts: Script[];
}

export interface TerminalCollectionIndexEntry {
  name: string;
  rootPath: string;
  referenceFile: string;
}

export interface TerminalCollectionIndex {
  entries: TerminalCollectionIndexEntry[];
}
