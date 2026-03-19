import { execNginx, defaultService, reloadTimeoutMs } from './utils';
import type { NginxResultReload } from './types';

export async function runReload(service: string = defaultService): Promise<NginxResultReload> {
  const result = await execNginx(`systemctl reload ${service}`, reloadTimeoutMs);
  return {
    action: 'reload',
    success: result.success,
  };
}
