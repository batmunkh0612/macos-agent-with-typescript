import type { PluginManager } from '../../plugin-manager';

export function extractPluginName(command: Record<string, unknown>): string {
  return String(command.plugin ?? '');
}

export async function executePluginCommand(
  pluginManager: PluginManager,
  command: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const pluginName = extractPluginName(command);
  if (!pluginName) return { success: false, error: "Missing 'plugin' field" };
  const args = (command.args ?? {}) as Record<string, unknown>;
  const result = await pluginManager.executePlugin(pluginName, args);
  return result as Record<string, unknown>;
}
