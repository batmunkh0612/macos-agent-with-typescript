import { exec } from 'child_process';

export interface ExecNginxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
}

function orEmpty(s: string | undefined): string {
  return s ?? '';
}

function errorMessageOrNull(error: Error | null): string | null {
  return error ? error.message : null;
}

function toExecNginxResult(
  stdout: string | undefined,
  stderr: string | undefined,
  error: Error | null
): ExecNginxResult {
  const out = orEmpty(stdout);
  const err = orEmpty(stderr);
  return {
    success: !error,
    stdout: out,
    stderr: err,
    error: errorMessageOrNull(error),
  };
}

export function execNginx(
  command: string,
  timeoutMs: number
): Promise<ExecNginxResult> {
  return new Promise((resolve) => {
    exec(command, { timeout: timeoutMs }, (error, stdout, stderr) => {
      resolve(toExecNginxResult(stdout, stderr, error));
    });
  });
}

export const defaultService = 'nginx';
export const restartTimeoutMs = 30000;
export const statusTimeoutMs = 10000;
export const reloadTimeoutMs = 30000;
export const testTimeoutMs = 10000;
