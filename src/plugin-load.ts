import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { createLogger } from './utils/logger';

const logger = createLogger('PluginLoad');

export type PluginModule = { handle?: (_input: unknown) => Promise<unknown> };

const hasSourceExtension = (file: string): boolean => file.endsWith('.ts') || file.endsWith('.js');

const isTestFile = (file: string): boolean => file.includes('.test.') || file.includes('.spec.');

const isPluginFile = (file: string): boolean => {
  if (!hasSourceExtension(file)) return false;
  return !isTestFile(file);
};

const importPlugin = async (pluginPath: string): Promise<PluginModule> => {
  const href = pathToFileURL(pluginPath).href;
  return import(href) as Promise<PluginModule>;
};

const finalizeModule = (name: string, pluginModule: PluginModule): PluginModule | null => {
  if (!pluginModule.handle) {
    logger.error(`Local plugin ${name} missing 'handle' function`);
    return null;
  }
  logger.info(`✅ Local plugin loaded: ${name}`);
  return pluginModule;
};

const logPluginLoadError = (name: string, e: unknown): void => {
  const msg = e instanceof Error ? e.message : String(e);
  logger.error(`Failed to load local plugin ${name}: ${msg}`);
};

const tryLoadOne = async (pluginsDir: string, file: string): Promise<PluginModule | null> => {
  const name = path.basename(file, path.extname(file));
  const pluginPath = path.join(pluginsDir, file);
  try {
    const pluginModule = await importPlugin(pluginPath);
    return finalizeModule(name, pluginModule);
  } catch (e: unknown) {
    logPluginLoadError(name, e);
    return null;
  }
};

export type PluginRegisterFn = (_name: string, _mod: PluginModule) => void;

const registerIfLoaded = async (
  pluginsDir: string,
  file: string,
  register: PluginRegisterFn
): Promise<void> => {
  if (!isPluginFile(file)) return;
  const name = path.basename(file, path.extname(file));
  const mod = await tryLoadOne(pluginsDir, file);
  if (mod) register(name, mod);
};

export const loadPluginsFromDir = async (pluginsDir: string, register: PluginRegisterFn): Promise<void> => {
  if (!fs.existsSync(pluginsDir)) {
    logger.warn(`Plugins directory does not exist: ${pluginsDir}`);
    return;
  }
  const files = fs.readdirSync(pluginsDir);
  for (const file of files) {
    await registerIfLoaded(pluginsDir, file, register);
  }
};
