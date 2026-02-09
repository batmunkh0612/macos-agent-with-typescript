import { createLogger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('PluginManager');

interface Plugin {
  handle: (args: any) => Promise<any>;
  [key: string]: any;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsDir: string;

  constructor(pluginsDir: string = path.join(__dirname, 'plugins')) {
    this.pluginsDir = pluginsDir;
  }

  public async loadLocalPlugins() {
    logger.info(`Loading local plugins from: ${this.pluginsDir}`);
    
    if (!fs.existsSync(this.pluginsDir)) {
      logger.warn(`Plugins directory does not exist: ${this.pluginsDir}`);
      return;
    }

    try {
      const files = fs.readdirSync(this.pluginsDir);
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
            if (file.includes('.test.') || file.includes('.spec.')) continue;

          const name = path.basename(file, path.extname(file));
          const pluginPath = path.join(this.pluginsDir, file);
          
          try {
            // Helper to dynamically require the plugin
            const pluginModule = require(pluginPath);
            
            if (pluginModule.handle) {
              this.plugins.set(name, pluginModule);
              logger.info(`✅ Local plugin loaded: ${name}`);
            } else {
              logger.error(`Local plugin ${name} missing 'handle' function`);
            }
          } catch (e: any) {
            logger.error(`Failed to load local plugin ${name}: ${e.message}`);
          }
        }
      }
      logger.info(`Total plugins loaded: ${Array.from(this.plugins.keys()).join(', ')}`);
    } catch (e: any) {
      logger.error(`Error loading plugins: ${e.message}`);
    }
  }

  public async executePlugin(name: string, args: any): Promise<any> {
    logger.info(`Executing plugin: ${name} with args: ${JSON.stringify(args)}`);
    
    const plugin = this.plugins.get(name);
    
    if (!plugin) {
      const errorMsg = `Plugin '${name}' not found. Available: ${Array.from(this.plugins.keys()).join(', ')}`;
      logger.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      const result = await plugin.handle(args);
      logger.info(`Plugin ${name} result: ${JSON.stringify(result)}`);
      
      if (typeof result === 'object' && result !== null) {
          if (!('success' in result)) {
              result.success = true;
          }
      }
      return result;
    } catch (e: any) {
      logger.error(`Plugin ${name} execution failed: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  public listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
