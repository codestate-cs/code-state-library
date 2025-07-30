// ErrorRegistry for mapping error codes to user messages and exit codes
import { ErrorCode } from './ErrorTypes';

export interface ErrorRegistryEntry {
  code: ErrorCode;
  userMessage: string;
  exitCode: number;
}

export const ErrorRegistry: Record<ErrorCode, ErrorRegistryEntry> = {
  [ErrorCode.UNKNOWN]: {
    code: ErrorCode.UNKNOWN,
    userMessage: 'An unknown error occurred.',
    exitCode: 1,
  },
  [ErrorCode.CONFIG_INVALID]: {
    code: ErrorCode.CONFIG_INVALID,
    userMessage: 'Configuration is invalid.',
    exitCode: 2,
  },
  [ErrorCode.STORAGE_INVALID_PATH]: {
    code: ErrorCode.STORAGE_INVALID_PATH,
    userMessage: 'Invalid file path.',
    exitCode: 3,
  },
  [ErrorCode.STORAGE_DECRYPTION_FAILED]: {
    code: ErrorCode.STORAGE_DECRYPTION_FAILED,
    userMessage: 'Decryption failed during storage operation.',
    exitCode: 4,
  },
  [ErrorCode.STORAGE_READ_FAILED]: {
    code: ErrorCode.STORAGE_READ_FAILED,
    userMessage: 'File read failed.',
    exitCode: 5,
  },
  [ErrorCode.STORAGE_WRITE_FAILED]: {
    code: ErrorCode.STORAGE_WRITE_FAILED,
    userMessage: 'File write failed.',
    exitCode: 6,
  },
  [ErrorCode.STORAGE_DELETE_FAILED]: {
    code: ErrorCode.STORAGE_DELETE_FAILED,
    userMessage: 'File delete failed.',
    exitCode: 7,
  },
  [ErrorCode.ENCRYPTION_FAILED]: {
    code: ErrorCode.ENCRYPTION_FAILED,
    userMessage: 'Encryption failed.',
    exitCode: 8,
  },
  [ErrorCode.ENCRYPTION_INVALID_FORMAT]: {
    code: ErrorCode.ENCRYPTION_INVALID_FORMAT,
    userMessage: 'Invalid encrypted data format.',
    exitCode: 9,
  },
  [ErrorCode.SCRIPT_INVALID]: {
    code: ErrorCode.SCRIPT_INVALID,
    userMessage: 'Script is invalid.',
    exitCode: 10,
  },
  [ErrorCode.SCRIPT_DUPLICATE]: {
    code: ErrorCode.SCRIPT_DUPLICATE,
    userMessage: 'Script already exists.',
    exitCode: 11,
  },
  [ErrorCode.SCRIPT_NOT_FOUND]: {
    code: ErrorCode.SCRIPT_NOT_FOUND,
    userMessage: 'Script not found.',
    exitCode: 12,
  },
  [ErrorCode.SCRIPT_PATH_INVALID]: {
    code: ErrorCode.SCRIPT_PATH_INVALID,
    userMessage: 'Script path is invalid.',
    exitCode: 13,
  },
  [ErrorCode.SCRIPT_MALICIOUS]: {
    code: ErrorCode.SCRIPT_MALICIOUS,
    userMessage: 'Script contains malicious content.',
    exitCode: 14,
  },
  [ErrorCode.GIT_NOT_REPOSITORY]: {
    code: ErrorCode.GIT_NOT_REPOSITORY,
    userMessage: 'Not a git repository.',
    exitCode: 15,
  },
  [ErrorCode.GIT_COMMAND_FAILED]: {
    code: ErrorCode.GIT_COMMAND_FAILED,
    userMessage: 'Git command failed.',
    exitCode: 16,
  },
  [ErrorCode.GIT_STASH_NOT_FOUND]: {
    code: ErrorCode.GIT_STASH_NOT_FOUND,
    userMessage: 'Git stash not found.',
    exitCode: 17,
  },
  [ErrorCode.GIT_STASH_CONFLICT]: {
    code: ErrorCode.GIT_STASH_CONFLICT,
    userMessage: 'Git stash apply resulted in conflicts.',
    exitCode: 18,
  },
  [ErrorCode.TERMINAL_COMMAND_FAILED]: {
    code: ErrorCode.TERMINAL_COMMAND_FAILED,
    userMessage: 'Terminal command failed.',
    exitCode: 19,
  },
  [ErrorCode.TERMINAL_TIMEOUT]: {
    code: ErrorCode.TERMINAL_TIMEOUT,
    userMessage: 'Terminal command timed out.',
    exitCode: 20,
  },
  [ErrorCode.TERMINAL_COMMAND_NOT_FOUND]: {
    code: ErrorCode.TERMINAL_COMMAND_NOT_FOUND,
    userMessage: 'Terminal command not found.',
    exitCode: 21,
  },
};

export function getUserMessageForErrorCode(code: ErrorCode): string {
  return ErrorRegistry[code]?.userMessage || ErrorRegistry[ErrorCode.UNKNOWN].userMessage;
}

export function getExitCodeForErrorCode(code: ErrorCode): number {
  return ErrorRegistry[code]?.exitCode || ErrorRegistry[ErrorCode.UNKNOWN].exitCode;
} 