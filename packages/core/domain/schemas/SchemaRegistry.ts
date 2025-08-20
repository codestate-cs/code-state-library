import { z } from 'zod';

// Core schemas for configuration and validation
export const LogLevelSchema = z.enum(['ERROR', 'WARN', 'LOG', 'DEBUG']);

export const LoggerConfigSchema = z.object({
  level: LogLevelSchema,
  sinks: z.array(z.enum(['console', 'file'])),
  filePath: z.string().optional(),
});

export const FileStorageConfigSchema = z.object({
  encryptionEnabled: z.boolean(),
  encryptionKey: z.string().optional(),
  dataDir: z.string(),
});

export const FeatureFlagsSchema = z.object({
  experimentalTui: z.boolean(),
  experimentalIde: z.boolean(),
  advancedSearch: z.boolean(),
  cloudSync: z.boolean(),
});

export const PluginEnvironmentSchema = z.enum(['cli', 'tui', 'ide']);

export const ErrorCodeSchema = z.enum([
  'UNKNOWN',
  'CONFIG_INVALID',
  'STORAGE_INVALID_PATH',
  'STORAGE_DECRYPTION_FAILED',
  'STORAGE_READ_FAILED',
  'STORAGE_WRITE_FAILED',
  'STORAGE_DELETE_FAILED',
  'ENCRYPTION_FAILED',
  'ENCRYPTION_INVALID_FORMAT',
  'SCRIPT_INVALID',
  'SCRIPT_DUPLICATE',
  'SCRIPT_NOT_FOUND',
  'SCRIPT_PATH_INVALID',
  'SCRIPT_MALICIOUS',
  'GIT_NOT_REPOSITORY',
  'GIT_COMMAND_FAILED',
  'GIT_STASH_NOT_FOUND',
  'GIT_STASH_CONFLICT',
  'TERMINAL_COMMAND_FAILED',
  'TERMINAL_TIMEOUT',
  'TERMINAL_COMMAND_NOT_FOUND',
]);

export const EncryptionConfigSchema = z.object({
  enabled: z.boolean(),
  encryptionKey: z.string().optional(),
});

export const ConfigSchema = z.object({
  version: z.string(),
  ide: z.string(),
  encryption: EncryptionConfigSchema,
  storagePath: z.string(),
  logger: LoggerConfigSchema,
  experimental: z.record(z.string(), z.boolean()).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

export const ScriptSchema = z.object({
  name: z.string().min(1, 'Script name is required'),
  rootPath: z.string().min(1, 'Root path is required'),
  script: z.string().min(1, 'Script command is required').optional(), // DEPRECATED: Backward compatible
  commands: z.array(z.object({
    command: z.string().min(1, 'Command is required'),
    name: z.string().min(1, 'Command name is required'),
    priority: z.number().int().min(0, 'Priority must be non-negative integer'),
  })).optional(), // NEW: Backward compatible
}).refine((data) => {
  // Ensure either script or commands is provided
  return data.script !== undefined || (data.commands !== undefined && data.commands.length > 0);
}, {
  message: 'Either script or commands array must be provided',
  path: ['script', 'commands'],
});

// NEW: Script command schema
export const ScriptCommandSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  name: z.string().min(1, 'Command name is required'),
  priority: z.number().int().min(0, 'Priority must be non-negative integer'),
});

export const ScriptIndexEntrySchema = z.object({
  rootPath: z.string().min(1, 'Root path is required'),
  referenceFile: z.string().min(1, 'Reference file path is required'),
});

export const ScriptIndexSchema = z.object({
  entries: z.array(ScriptIndexEntrySchema),
});

export const ScriptCollectionSchema = z.object({
  scripts: z.array(ScriptSchema),
});

// Git schemas
export const GitFileStatusSchema = z.enum(['modified', 'added', 'deleted', 'untracked', 'renamed', 'copied', 'updated']);

export const GitFileSchema = z.object({
  path: z.string(),
  status: GitFileStatusSchema,
  staged: z.boolean(),
});

export const GitStatusSchema = z.object({
  isDirty: z.boolean(),
  dirtyFiles: z.array(GitFileSchema),
  newFiles: z.array(GitFileSchema),
  modifiedFiles: z.array(GitFileSchema),
  deletedFiles: z.array(GitFileSchema),
  untrackedFiles: z.array(GitFileSchema),
});

export const GitStashSchema = z.object({
  id: z.string(),
  name: z.string(),
  message: z.string(),
  timestamp: z.number(),
  branch: z.string(),
});

export const GitStashResultSchema = z.object({
  success: z.boolean(),
  stashId: z.string().optional(),
  error: z.string().optional(),
});

export const GitStashApplyResultSchema = z.object({
  success: z.boolean(),
  conflicts: z.array(z.string()).optional(),
  error: z.string().optional(),
});

// Terminal schemas
export const TerminalCommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
});

export const TerminalResultSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  duration: z.number(),
  error: z.string().optional(),
});

export const TerminalOptionsSchema = z.object({
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  timeout: z.number().optional(),
  shell: z.string().optional(),
});

// Session schemas
export const FileStateSchema = z.object({
  path: z.string(),
  cursor: z
    .object({ line: z.number(), column: z.number() })
    .optional(),
  scroll: z
    .object({ top: z.number(), left: z.number() })
    .optional(),
  isActive: z.boolean(),
  position: z.number().optional(), // NEW: Backward compatible
});

export const GitStateSchema = z.object({
  branch: z.string(),
  commit: z.string(),
  isDirty: z.boolean(),
  stashId: z.string().nullable().optional(),
});

// NEW: Session terminal command schema
export const SessionTerminalCommandSchema = z.object({
  command: z.string(),
  name: z.string(),
  priority: z.number().int().min(0, 'Priority must be non-negative integer'),
});

// NEW: Terminal command state schema
export const TerminalCommandStateSchema = z.object({
  terminalId: z.number(),
  terminalName: z.string().optional(),
  commands: z.array(SessionTerminalCommandSchema),
});

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectRoot: z.string(),
  createdAt: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  updatedAt: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  files: z.array(FileStateSchema),
  git: GitStateSchema,
  extensions: z.record(z.string(), z.unknown()).optional(),
  terminalCommands: z.array(TerminalCommandStateSchema).optional(), // NEW: Backward compatible
});

// Session index entry schema
export const SessionIndexEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  projectRoot: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  referenceFile: z.string(),
});

export const SessionIndexSchema = z.object({
  version: z.string(),
  sessions: z.array(SessionIndexEntrySchema),
});

// Schema registry for easy access and validation
export const SchemaRegistry = {
  LogLevel: LogLevelSchema,
  LoggerConfig: LoggerConfigSchema,
  FileStorageConfig: FileStorageConfigSchema,
  FeatureFlags: FeatureFlagsSchema,
  PluginEnvironment: PluginEnvironmentSchema,
  ErrorCode: ErrorCodeSchema,
  Config: ConfigSchema,
  Script: ScriptSchema,
  ScriptCommand: ScriptCommandSchema, // NEW
  ScriptIndexEntry: ScriptIndexEntrySchema,
  ScriptIndex: ScriptIndexSchema,
  ScriptCollection: ScriptCollectionSchema,
  GitFileStatus: GitFileStatusSchema,
  GitFile: GitFileSchema,
  GitStatus: GitStatusSchema,
  GitStash: GitStashSchema,
  GitStashResult: GitStashResultSchema,
  GitStashApplyResult: GitStashApplyResultSchema,
  TerminalCommand: TerminalCommandSchema,
  TerminalResult: TerminalResultSchema,
  TerminalOptions: TerminalOptionsSchema,
  SessionTerminalCommand: SessionTerminalCommandSchema, // NEW
  TerminalCommandState: TerminalCommandStateSchema, // NEW
  FileState: FileStateSchema,
  GitState: GitStateSchema,
  Session: SessionSchema,
  SessionIndexEntry: SessionIndexEntrySchema,
  SessionIndex: SessionIndexSchema,
} as const;

// Type exports for use in TypeScript
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;
export type FileStorageConfig = z.infer<typeof FileStorageConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type PluginEnvironment = z.infer<typeof PluginEnvironmentSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type Script = z.infer<typeof ScriptSchema>;
export type ScriptCommand = z.infer<typeof ScriptCommandSchema>; // NEW
export type ScriptIndexEntry = z.infer<typeof ScriptIndexEntrySchema>;
export type ScriptIndex = z.infer<typeof ScriptIndexSchema>;
export type ScriptCollection = z.infer<typeof ScriptCollectionSchema>;
export type GitFileStatus = z.infer<typeof GitFileStatusSchema>;
export type GitFile = z.infer<typeof GitFileSchema>;
export type GitStatus = z.infer<typeof GitStatusSchema>;
export type GitStash = z.infer<typeof GitStashSchema>;
export type GitStashResult = z.infer<typeof GitStashResultSchema>;
export type GitStashApplyResult = z.infer<typeof GitStashApplyResultSchema>;
export type TerminalCommand = z.infer<typeof TerminalCommandSchema>;
export type TerminalResult = z.infer<typeof TerminalResultSchema>;
export type TerminalOptions = z.infer<typeof TerminalOptionsSchema>;
export type SessionTerminalCommand = z.infer<typeof SessionTerminalCommandSchema>; // NEW
export type TerminalCommandState = z.infer<typeof TerminalCommandStateSchema>; // NEW
export type FileState = z.infer<typeof FileStateSchema>;
export type GitState = z.infer<typeof GitStateSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionIndexEntry = z.infer<typeof SessionIndexEntrySchema>;
export type SessionIndex = z.infer<typeof SessionIndexSchema>;

// Validation helpers
export function validateLoggerConfig(data: unknown): LoggerConfig {
  return LoggerConfigSchema.parse(data);
}

export function validateFileStorageConfig(data: unknown): FileStorageConfig {
  return FileStorageConfigSchema.parse(data);
}

export function validateFeatureFlags(data: unknown): FeatureFlags {
  return FeatureFlagsSchema.parse(data);
}

export function validateConfig(data: unknown): Config {
  return ConfigSchema.parse(data);
}

export function validateScript(data: unknown): Script {
  return ScriptSchema.parse(data);
}

export function validateScriptIndex(data: unknown): ScriptIndex {
  return ScriptIndexSchema.parse(data);
}

export function validateScriptCollection(data: unknown): ScriptCollection {
  return ScriptCollectionSchema.parse(data);
}

export function validateGitStatus(data: unknown): GitStatus {
  return GitStatusSchema.parse(data);
}

export function validateGitStash(data: unknown): GitStash {
  return GitStashSchema.parse(data);
}

export function validateTerminalCommand(data: unknown): TerminalCommand {
  return TerminalCommandSchema.parse(data);
}

export function validateSessionTerminalCommand(data: unknown): SessionTerminalCommand {
  return SessionTerminalCommandSchema.parse(data);
}

export function validateTerminalResult(data: unknown): TerminalResult {
  return TerminalResultSchema.parse(data);
}

export function validateSession(data: unknown): Session {
  return SessionSchema.parse(data);
}

export function validateSessionIndex(data: unknown): SessionIndex {
  return SessionIndexSchema.parse(data);
}

export function validateScriptCommand(data: unknown): ScriptCommand {
  return ScriptCommandSchema.parse(data);
}

export function validateTerminalCommandState(data: unknown): TerminalCommandState {
  return TerminalCommandStateSchema.parse(data);
} 