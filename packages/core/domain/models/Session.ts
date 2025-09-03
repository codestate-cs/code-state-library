import { Script } from "./Script";
import { TerminalCollectionWithScripts } from "./TerminalCollection";

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
  terminalCommands?: TerminalCommandState[]; // NEW: Terminal commands with metadata (backward compatible)
  terminalCollections?: string[]; // NEW: Terminal collection IDs
  scripts?: string[]; // NEW: Individual script IDs
}

export interface SessionWithFullData extends Session {
  terminalCollectionsData?: TerminalCollectionWithScripts[];
  scriptsData?: Script[];
}

export interface FileState {
  path: string;
  cursor?: { line: number; column: number };
  scroll?: { top: number; left: number };
  isActive: boolean;
  position?: number; // NEW: Priority/order for opening files (backward compatible)
}

export interface GitState {
  branch: string;
  commit: string;
  isDirty: boolean;
  stashId?: string | null;
}

// NEW: Terminal command state for session storage (UPDATED to use array structure)
export interface TerminalCommandState {
  terminalId: number;
  terminalName?: string; // Optional terminal name if available
  commands: SessionTerminalCommand[]; // Array of commands with priority
}

// NEW: Individual terminal command with priority
export interface SessionTerminalCommand {
  command: string;
  name: string;
  priority: number;
}