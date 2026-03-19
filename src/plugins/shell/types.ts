export interface ShellArgs {
  script: string;
  timeout?: number;
  cwd?: string;
}

export interface ShellResult {
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
}
