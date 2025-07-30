export interface Script {
  name: string;
  rootPath: string;
  script: string;
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