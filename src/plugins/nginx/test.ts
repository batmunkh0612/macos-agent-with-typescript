import { execNginx, testTimeoutMs } from './utils';
import type { NginxResultTest } from './types';

export async function runTest(): Promise<NginxResultTest> {
  const result = await execNginx('nginx -t', testTimeoutMs);
  const output = result.stdout + result.stderr;
  return {
    action: 'test',
    valid: result.success,
    output,
  };
}
