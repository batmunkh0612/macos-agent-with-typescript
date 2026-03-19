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

function getExitCode(error: unknown): number {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string | number }).code;
    return typeof code === 'number' ? code : 1;
  }
  return 1;
}

export const handle = async (args: ShellArgs): Promise<ShellResult> => {
  const command = args.command;
  if (!command) return { success: false, error: 'command is required' };

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: (args.timeout ?? 30) * 1000,
      cwd: args.cwd,
      maxBuffer: 1024 * 1024,
    });
    return {
      success: true,
      stdout: String(stdout),
      stderr: String(stderr),
      exitCode: 0,
    };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'stdout' in e && 'stderr' in e) {
      const out = e as { stdout?: string; stderr?: string };
      return {
        success: false,
        stdout: out.stdout ?? '',
        stderr: out.stderr ?? '',
        exitCode: getExitCode(e),
        error: e instanceof Error ? e.message : String(e),
      };
    }
    return {
      success: false,
      exitCode: getExitCode(e),
      error: e instanceof Error ? e.message : String(e),
    };
  }
};
