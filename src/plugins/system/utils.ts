import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { USERNAME_REGEX } from './types';
import type { ExecResult } from './types';

export const isRoot = (): boolean => process.getuid !== undefined && process.getuid() === 0;

export const rootCmd = (cmd: string): string => (isRoot() ? cmd : `sudo ${cmd}`);

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function shQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorReturnCode(error: NodeJS.ErrnoException): number {
  return typeof error.code === 'number' ? error.code : 1;
}

function successExecResult(out: string, err: string): ExecResult {
  return { stdout: out, stderr: err, success: true, returncode: 0 };
}

function failureExecResult(
  out: string,
  err: string,
  error: Error
): ExecResult {
  const returncode = errorReturnCode(error as NodeJS.ErrnoException);
  return { stdout: out, stderr: err, success: false, error: error.message, returncode };
}

function orEmpty(s: string | undefined): string {
  return s ?? '';
}

function toExecResult(
  stdout: string | undefined,
  stderr: string | undefined,
  error: Error | null
): ExecResult {
  const out = orEmpty(stdout);
  const err = orEmpty(stderr);
  return error ? failureExecResult(out, err, error) : successExecResult(out, err);
}

export function execPromise(
  command: string,
  options: { timeout?: number } = {}
): Promise<ExecResult> {
  return new Promise((resolve) => {
    exec(command, { timeout: options.timeout }, (error, stdout, stderr) => {
      resolve(toExecResult(stdout, stderr, error));
    });
  });
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
