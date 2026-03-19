import { execNginx, defaultService, restartTimeoutMs } from './utils';
import type { NginxResultRestart } from './types';

export async function runRestart(service: string = defaultService): Promise<NginxResultRestart> {
  const result = await execNginx(`systemctl restart ${service}`, restartTimeoutMs);
  const errorOut = result.stderr || result.error;
  return {
    action: 'restart',
    success: result.success,
    output: result.stdout,
    error: errorOut ?? null,
  };
}
