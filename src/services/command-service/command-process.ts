import type { PluginManager } from '../../plugin-manager';
import { executeStandardCommand } from './command-handlers';
import { executePluginCommand } from './command-plugin';
import type { CommandHandlerFn } from './types';

const pluginTypes = ['plugin', 'plugin_command'];

export async function processCommand(
  cmdType: string,
  command: Record<string, unknown>,
  pluginManager: PluginManager,
  standardHandlers: Map<string, CommandHandlerFn>
): Promise<Record<string, unknown>> {
  if (pluginTypes.includes(cmdType)) {
    return await executePluginCommand(pluginManager, command);
  }
  return await executeStandardCommand(standardHandlers, cmdType, command);
}
