import { execNginx, defaultService, statusTimeoutMs } from './utils';
import type { NginxResultStatus } from './types';

export async function runStatus(service: string = defaultService): Promise<NginxResultStatus> {
  const result = await execNginx(`systemctl status ${service}`, statusTimeoutMs);
  return {
    action: 'status',
    running: result.success,
    output: result.stdout,
  };
}
