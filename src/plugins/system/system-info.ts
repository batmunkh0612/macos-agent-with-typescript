import * as os from 'os';

function addCpu(info: Record<string, unknown>, type: string): void {
  if (type === 'all' || type === 'cpu') info.cpu = os.cpus();
}
function addMemory(info: Record<string, unknown>, type: string): void {
  if (type === 'all' || type === 'memory') info.memory = { total: os.totalmem(), free: os.freemem() };
}
function addNetwork(info: Record<string, unknown>, type: string): void {
  if (type === 'all' || type === 'network') info.network = os.networkInterfaces();
}

export async function getSystemInfo(type: string): Promise<Record<string, unknown>> {
  const info: Record<string, unknown> = {};
  addCpu(info, type);
  addMemory(info, type);
  addNetwork(info, type);
  return info;
}
