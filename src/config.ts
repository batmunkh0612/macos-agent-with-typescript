import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { createLogger } from './utils/logger';
import { getMachineId } from './utils/system';

const logger = createLogger('Config');

export interface AgentConfigType {
  server: {
    ws_url: string;
    graphql_url: string;
  };
  agent: {
    id: string;
    heartbeat_interval: number;
    poll_interval: number;
  };
  plugins: {
    auto_sync: boolean;
    sync_interval: number;
  };
  network: {
    wait_at_startup: boolean;
    timeout: number;
    check_interval: number;
    check_url: string;
  };
  updates: {
    auto_update: boolean;
    check_interval: number;
    update_url: string;
  };
}

const DEFAULT_CONFIG: AgentConfigType = {
  server: {
    ws_url: 'wss://your-worker.workers.dev/ws',
    graphql_url: 'https://your-worker.workers.dev/graphql',
  },
  agent: {
    id: 'auto',
    heartbeat_interval: 30,
    poll_interval: 60,
  },
  plugins: {
    auto_sync: true,
    sync_interval: 300,
  },
  network: {
    wait_at_startup: true,
    timeout: 120,
    check_interval: 5,
    check_url: 'https://www.google.com',
  },
  updates: {
    auto_update: false,
    check_interval: 3600,
    update_url: '',
  }
};

export class AgentConfig {
  private config: AgentConfigType;
  private configFile: string;

  constructor(configFile: string = 'config.yaml') {
    this.configFile = path.resolve(process.cwd(), configFile);
    this.config = this.loadConfig();
  }

  private loadConfig(): AgentConfigType {
    try {
      if (fs.existsSync(this.configFile)) {
        const fileContents = fs.readFileSync(this.configFile, 'utf8');
        const loaded = yaml.load(fileContents) as any;
        return this.mergeWithDefault(loaded);
      } else {
        logger.warn(`Config file not found: ${this.configFile}`);
        return this.mergeWithDefault({});
      }
    } catch (e: any) {
      logger.error(`Error loading config: ${e.message}`);
      return this.mergeWithDefault({});
    }
  }

  private mergeWithDefault(loaded: any): AgentConfigType {
    const config = { ...DEFAULT_CONFIG, ...loaded };
    
    // Deep merge for nested objects (simplified)
    if (loaded.server) config.server = { ...DEFAULT_CONFIG.server, ...loaded.server };
    if (loaded.agent) config.agent = { ...DEFAULT_CONFIG.agent, ...loaded.agent };
    if (loaded.plugins) config.plugins = { ...DEFAULT_CONFIG.plugins, ...loaded.plugins };
    if (loaded.network) config.network = { ...DEFAULT_CONFIG.network, ...loaded.network };
    if (loaded.updates) config.updates = { ...DEFAULT_CONFIG.updates, ...loaded.updates };

    // Resolve Auto ID
    if (!config.agent.id || config.agent.id.toLowerCase() === 'auto') {
      config.agent.id = getMachineId();
      logger.info(`Auto-detected machine ID: ${config.agent.id}`);
    }

    return config;
  }

  public get<K extends keyof AgentConfigType>(key: K): AgentConfigType[K] {
    return this.config[key];
  }
  
  public getAll(): AgentConfigType {
      return this.config;
  }
}
