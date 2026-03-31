import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ShellArgs {
  command?: string;
  timeout?: number;
  cwd?: string;
}

export interface ShellResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  [key: string]: unknown;
}

const asObject = (error: unknown): Record<string, unknown> | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  return error as Record<string, unknown>;
};

const readCodeField = (rec: Record<string, unknown>): number | undefined => {
  if (!('code' in rec)) return undefined;
  const code = rec.code;
  return typeof code === 'number' ? code : undefined;
};

const readNumericCode = (error: unknown): number | undefined => {
  const rec = asObject(error);
  if (!rec) return undefined;
  return readCodeField(rec);
};

const getExitCode = (error: unknown): number => readNumericCode(error) ?? 1;

const hasStdStreams = (e: unknown): e is { stdout?: string; stderr?: string } => {
  const rec = asObject(e);
  if (!rec) return false;
  if (!('stdout' in rec)) return false;
  return 'stderr' in rec;
};

const toErrorMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const failureWithStreams = (e: unknown): ShellResult => {
  const out = e as { stdout?: string; stderr?: string };
  return {
    success: false,
    stdout: out.stdout ?? '',
    stderr: out.stderr ?? '',
    exitCode: getExitCode(e),
    error: toErrorMessage(e),
  };
};

const failureSimple = (e: unknown): ShellResult => ({
  success: false,
  exitCode: getExitCode(e),
  error: toErrorMessage(e),
});

const runExec = async (args: ShellArgs, command: string) =>
  execAsync(command, {
    timeout: (args.timeout ?? 30) * 1000,
    cwd: args.cwd,
    maxBuffer: 1024 * 1024,
  });

const onExecError = (e: unknown): ShellResult => {
  if (hasStdStreams(e)) return failureWithStreams(e);
  return failureSimple(e);
};

export const handle = async (args: ShellArgs): Promise<ShellResult> => {
  const command = args.command;
  if (!command) return { success: false, error: 'command is required' };

  try {
    const { stdout, stderr } = await runExec(args, command);
    return {
      success: true,
      stdout: String(stdout),
      stderr: String(stderr),
      exitCode: 0,
    };
  } catch (e: unknown) {
    return onExecError(e);
  }
};
