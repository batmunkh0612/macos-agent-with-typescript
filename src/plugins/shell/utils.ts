import { exec } from 'child_process';
import type { ShellResult } from './types';

const defaultTimeoutSec = 30;

export function getTimeoutMs(timeoutSec?: number): number {
  return (timeoutSec ?? defaultTimeoutSec) * 1000;
}

function trimOrEmpty(s: string | undefined): string {
  return s ? s.trim() : '';
}

function exitCodeFromError(error: Error | null): number {
  if (!error) return 0;
  const code = (error as NodeJS.ErrnoException).code;
  return typeof code === 'number' ? code : 1;
}

function toShellResult(
  stdout: string | undefined,
  stderr: string | undefined,
  error: Error | null
): ShellResult {
  const code = exitCodeFromError(error);
  return {
    success: !error,
    exitCode: code,
    stdout: trimOrEmpty(stdout),
    stderr: trimOrEmpty(stderr),
  };
}

export function execScript(
  script: string,
  options: { timeout: number; cwd?: string }
): Promise<ShellResult> {
  return new Promise((resolve) => {
    exec(script, { timeout: options.timeout, cwd: options.cwd }, (err, stdout, stderr) => {
      resolve(toShellResult(stdout, stderr, err));
    });
  });
}

export function toErrorResult(message: string): ShellResult {
  return { success: false, error: message };
}
