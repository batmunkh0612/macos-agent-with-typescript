import { createLogger } from './utils/logger';
import * as path from 'path';
import { loadPluginsFromDir, type PluginModule } from './plugin-load';
import { redactSecrets } from './plugin-redact';

const logger = createLogger('PluginManager');

const ensureSuccessFlag = (result: Record<string, unknown>): void => {
  if (!('success' in result)) {
    result.success = true;
  }
};

const notFoundPayload = (name: string, keys: string[]): Record<string, unknown> => {
  const errorMsg = `Plugin '${name}' not found. Available: ${keys.join(', ')}`;
  logger.error(errorMsg);
  return { success: false, error: errorMsg };
};

const normalizePluginResult = (result: unknown): unknown => {
  if (typeof result !== 'object' || result === null) return result;
  ensureSuccessFlag(result as Record<string, unknown>);
  return result;
};

const runPlugin = async (plugin: PluginModule, name: string, args: unknown): Promise<unknown> => {
  const result = await plugin.handle?.(args);
  logger.info(`Plugin ${name} result: ${JSON.stringify(redactSecrets(result))}`);
  return normalizePluginResult(result);
};

const invokeOrFail = async (name: string, plugin: PluginModule, args: unknown): Promise<unknown> => {
  try {
    return await runPlugin(plugin, name, args);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error(`Plugin ${name} execution failed: ${msg}`);
    return { success: false, error: msg };
  }
};

export class PluginManager {
  private plugins: Map<string, PluginModule> = new Map();
  private pluginsDir: string;

  constructor(pluginsDir: string = path.join(__dirname, 'plugins')) {
    this.pluginsDir = pluginsDir;
  }

  public async loadLocalPlugins(): Promise<void> {
    logger.info(`Loading local plugins from: ${this.pluginsDir}`);
    try {
      await loadPluginsFromDir(this.pluginsDir, (name, mod) => {
        this.plugins.set(name, mod);
      });
      logger.info(`Total plugins loaded: ${Array.from(this.plugins.keys()).join(', ')}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error(`Error loading plugins: ${msg}`);
    }
  }

  public async executePlugin(name: string, args: unknown): Promise<unknown> {
    logger.info(`Executing plugin: ${name} with args: ${JSON.stringify(redactSecrets(args))}`);

    const plugin = this.plugins.get(name);
    if (!plugin) return notFoundPayload(name, Array.from(this.plugins.keys()));
    return invokeOrFail(name, plugin, args);
  }

  public listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
