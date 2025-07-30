export interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface TerminalResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}

export interface TerminalOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  shell?: string;
} 