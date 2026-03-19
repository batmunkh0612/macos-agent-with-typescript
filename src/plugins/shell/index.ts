import { createLogger } from '../../utils/logger';
import { execScript, getTimeoutMs, toErrorResult } from './utils';
import type { ShellArgs, ShellResult } from './types';

const logger = createLogger('Plugin.Shell');

const maxLogLength = 200;

function logStdout(stdout: string | undefined): void {
  if (stdout) logger.info(`stdout: ${stdout.substring(0, maxLogLength)}`);
}

function logStderr(stderr: string | undefined): void {
  if (stderr) logger.warn(`stderr: ${stderr.substring(0, maxLogLength)}`);
}

function logResult(result: ShellResult): void {
  if (result.exitCode !== undefined) {
    logger.info(`Script completed with exit code: ${result.exitCode}`);
  }
  logStdout(result.stdout);
  logStderr(result.stderr);
}

async function runScript(args: ShellArgs): Promise<ShellResult> {
  const timeoutMs = getTimeoutMs(args.timeout);
  logger.info(`Executing shell script: ${args.script} (timeout: ${timeoutMs / 1000}s)`);
  const result = await execScript(args.script, { timeout: timeoutMs, cwd: args.cwd });
  logResult(result);
  return result;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const handle = async (args: ShellArgs): Promise<ShellResult> => {
  if (!args.script) return toErrorResult("Missing 'script' argument");
  try {
    return await runScript(args);
  } catch (e: unknown) {
    logger.error(`Script execution failed: ${errorMessage(e)}`);
    return toErrorResult(errorMessage(e));
  }
};

export type { ShellArgs, ShellResult } from './types';
