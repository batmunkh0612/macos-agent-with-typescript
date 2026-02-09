import { exec } from 'child_process';
import { createLogger } from '../utils/logger';

const logger = createLogger('Plugin.Shell');

interface ShellArgs {
  script: string;
  timeout?: number;
  cwd?: string;
}

export const handle = async (args: ShellArgs): Promise<any> => {
  const script = args.script;
  const timeout = (args.timeout || 30) * 1000;
  const cwd = args.cwd;

  if (!script) {
    return { success: false, error: "Missing 'script' argument" };
  }

  logger.info(`Executing shell script: ${script} (timeout: ${timeout / 1000}s)`);

  return new Promise((resolve) => {
    try {
      exec(script, { timeout, cwd }, (error, stdout, stderr) => {
        const exitCode = error ? error.code : 0;
        
        const result = {
          success: !error,
          exit_code: exitCode,
          stdout: stdout ? stdout.trim() : '',
          stderr: stderr ? stderr.trim() : '',
        };

        logger.info(`Script completed with exit code: ${exitCode}`);
        if (stdout) logger.info(`stdout: ${stdout.substring(0, 200)}`);
        if (stderr) logger.warn(`stderr: ${stderr.substring(0, 200)}`);

        resolve(result);
      });
    } catch (e: any) {
      logger.error(`Script execution failed: ${e.message}`);
      resolve({ success: false, error: e.message });
    }
  });
};
