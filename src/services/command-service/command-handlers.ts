import type { GraphQLClient } from '../../graphql';
import type { PluginManager } from '../../plugin-manager';
import { runCheckUpdate, runSelfUpdate } from '../self-update/run-self-update';
import { scheduleAgentRestart } from '../self-update/schedule-restart';
import type { CommandHandlerFn } from './types';

export interface SelfUpdateCommandDeps {
  graphql: GraphQLClient;
  version: string;
}

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

export const buildCommandHandlers = (
  pluginManager: PluginManager,
  getStatusResponse: () => Record<string, unknown>,
  selfUpdateDeps: SelfUpdateCommandDeps
): Map<string, CommandHandlerFn> =>
  new Map<string, CommandHandlerFn>([
    ['ping', () => ({ message: 'pong', timestamp: new Date().toISOString() })],
    ['list_plugins', () => ({ success: true, plugins: pluginManager.listPlugins() })],
    ['get_status', () => getStatusResponse()],
    [
      'restart',
      () => {
        scheduleAgentRestart(2000);
        return { success: true, message: 'Restart scheduled' };
      },
    ],
    ['check_update', () => runCheckUpdate(selfUpdateDeps.graphql, selfUpdateDeps.version)],
    ['self_update', (cmd) => runSelfUpdate(selfUpdateDeps.graphql, selfUpdateDeps.version, cmd ?? {})],
  ]);

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
