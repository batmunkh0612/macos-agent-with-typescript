import type { PluginManager } from '../../plugin-manager';
import type { CommandHandlerFn } from './types';

export interface StatusContext {
  agentId: string;
  version: string;
  wsConnected: boolean;
  listPlugins: () => string[];
}

export function buildStatusResponse(ctx: StatusContext): Record<string, unknown> {
  return {
    success: true,
    agentId: ctx.agentId,
    version: ctx.version,
    uptime: process.uptime(),
    plugins: ctx.listPlugins(),
    wsConnected: ctx.wsConnected,
    platform: process.platform,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
}

export function buildCommandHandlers(
  pluginManager: PluginManager,
  getStatusResponse: () => Record<string, unknown>
): Map<string, CommandHandlerFn> {
  return new Map([
    ['ping', () => ({ message: 'pong', timestamp: new Date().toISOString() })],
    ['list_plugins', () => ({ success: true, plugins: pluginManager.listPlugins() })],
    ['get_status', getStatusResponse],
    ['restart', () => ({ success: true, message: 'Agent restarting...' })],
  ]);
}

export async function executeStandardCommand(
  handlers: Map<string, CommandHandlerFn>,
  cmdType: string,
  command: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const handler = handlers.get(cmdType);
  if (!handler) return { error: `Unknown command type: ${cmdType}` };
  const result = handler(command);
  return result instanceof Promise ? await result : result;
}
