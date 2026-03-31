import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { buildFromYaml, logConfigError, resolveAutoAgentId } from './config-merge';
import type { AgentConfigType } from './config-schema';
import { createLogger } from './utils/logger';

export type { AgentConfigType } from './config-schema';

const logger = createLogger('Config');

export class AgentConfig {
  private config: AgentConfigType;
  private configFile: string;

  constructor(configFile: string = 'config.yaml') {
    this.configFile = path.resolve(process.cwd(), configFile);
    this.config = this.loadConfig();
  }

  private readYamlOrEmpty(): AgentConfigType {
    if (!fs.existsSync(this.configFile)) {
      logger.warn(`Config file not found: ${this.configFile}`);
      return buildFromYaml({});
    }
    const fileContents = fs.readFileSync(this.configFile, 'utf8');
    const loaded = yaml.load(fileContents) as unknown;
    return buildFromYaml(loaded);
  }

  private loadConfig(): AgentConfigType {
    try {
      const merged = this.readYamlOrEmpty();
      resolveAutoAgentId(merged);
      return merged;
    } catch (e: unknown) {
      logConfigError(e);
      const fallback = buildFromYaml({});
      resolveAutoAgentId(fallback);
      return fallback;
    }
  }

  public get<K extends keyof AgentConfigType>(key: K): AgentConfigType[K] {
    return this.config[key];
  }

  public getAll(): AgentConfigType {
    return this.config;
  }
}
