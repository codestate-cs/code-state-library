export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  CONFIG_INVALID = 'CONFIG_INVALID',
  STORAGE_INVALID_PATH = 'STORAGE_INVALID_PATH',
  STORAGE_DECRYPTION_FAILED = 'STORAGE_DECRYPTION_FAILED',
  STORAGE_READ_FAILED = 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED = 'STORAGE_WRITE_FAILED',
  STORAGE_DELETE_FAILED = 'STORAGE_DELETE_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  ENCRYPTION_INVALID_FORMAT = 'ENCRYPTION_INVALID_FORMAT',
  SCRIPT_INVALID = 'SCRIPT_INVALID',
  SCRIPT_DUPLICATE = 'SCRIPT_DUPLICATE',
  SCRIPT_NOT_FOUND = 'SCRIPT_NOT_FOUND',
  SCRIPT_PATH_INVALID = 'SCRIPT_PATH_INVALID',
  SCRIPT_MALICIOUS = 'SCRIPT_MALICIOUS',
  GIT_NOT_REPOSITORY = 'GIT_NOT_REPOSITORY',
  GIT_COMMAND_FAILED = 'GIT_COMMAND_FAILED',
  GIT_STASH_NOT_FOUND = 'GIT_STASH_NOT_FOUND',
  GIT_STASH_CONFLICT = 'GIT_STASH_CONFLICT',
  TERMINAL_COMMAND_FAILED = 'TERMINAL_COMMAND_FAILED',
  TERMINAL_TIMEOUT = 'TERMINAL_TIMEOUT',
  TERMINAL_COMMAND_NOT_FOUND = 'TERMINAL_COMMAND_NOT_FOUND',
}

export interface StandardizedErrorShape {
  code: ErrorCode;
  name: string;
  message: string;
  meta?: Record<string, unknown>;
}

export class AppError extends Error implements StandardizedErrorShape {
  code: ErrorCode;
  meta?: Record<string, unknown>;
  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.meta = meta;
  }
}

export class ConfigError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, ErrorCode.CONFIG_INVALID, meta);
    this.name = 'ConfigError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.STORAGE_READ_FAILED, meta?: Record<string, unknown>) {
    super(message, code, meta);
    this.name = 'StorageError';
  }
}

export class EncryptionError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.ENCRYPTION_FAILED, meta?: Record<string, unknown>) {
    super(message, code, meta);
    this.name = 'EncryptionError';
  }
}

export class ScriptError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.SCRIPT_INVALID, meta?: Record<string, unknown>) {
    super(message, code, meta);
    this.name = 'ScriptError';
  }
}

export class GitError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.GIT_COMMAND_FAILED, meta?: Record<string, unknown>) {
    super(message, code, meta);
    this.name = 'GitError';
  }
}

export class TerminalError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.TERMINAL_COMMAND_FAILED, meta?: Record<string, unknown>) {
    super(message, code, meta);
    this.name = 'TerminalError';
  }
} 