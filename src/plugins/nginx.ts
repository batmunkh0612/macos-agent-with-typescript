import { exec } from 'child_process';
import { createLogger } from '../utils/logger';

const logger = createLogger('Plugin.Nginx');

interface NginxArgs {
  action: 'restart' | 'status' | 'reload' | 'test';
  service?: string;
}

export const handle = async (args: NginxArgs): Promise<any> => {
  const action = args.action;
  const service = args.service || 'nginx';

  logger.info(`Nginx action: ${action}`);

  return new Promise((resolve) => {
    try {
      if (action === 'restart') {
        exec(`systemctl restart ${service}`, { timeout: 30000 }, (error, stdout, stderr) => {
          resolve({
            action: 'restart',
            success: !error,
            output: stdout,
            error: stderr || (error ? error.message : null),
          });
        });
      } else if (action === 'status') {
        exec(`systemctl status ${service}`, { timeout: 10000 }, (error, stdout, stderr) => {
          resolve({
            action: 'status',
            running: !error,
            output: stdout,
          });
        });
      } else if (action === 'reload') {
        exec(`systemctl reload ${service}`, { timeout: 30000 }, (error, stdout, stderr) => {
          resolve({
            action: 'reload',
            success: !error,
          });
        });
      } else if (action === 'test') {
        exec('nginx -t', { timeout: 10000 }, (error, stdout, stderr) => {
          resolve({
            action: 'test',
            valid: !error,
            output: stdout + stderr,
          });
        });
      } else {
        resolve({ error: `Unknown action: ${action}` });
      }
    } catch (e: any) {
      resolve({ error: e.message });
    }
  });
};
