import { createLogger } from './utils/logger';
import { getMachineId } from './utils/system';
import type { AgentConfigType } from './config-schema';
import { DEFAULT_AGENT_CONFIG } from './config-schema';

const logger = createLogger('Config');

type YamlRecord = Record<string, unknown>;

const asRecord = (v: unknown): YamlRecord | undefined =>
  v && typeof v === 'object' ? (v as YamlRecord) : undefined;

const str = (o: YamlRecord, k: string): string | undefined =>
  typeof o[k] === 'string' ? (o[k] as string) : undefined;

const num = (o: YamlRecord, k: string): number | undefined =>
  typeof o[k] === 'number' ? (o[k] as number) : undefined;

const bool = (o: YamlRecord, k: string): boolean | undefined =>
  typeof o[k] === 'boolean' ? (o[k] as boolean) : undefined;

const pickStr = (o: YamlRecord, k: string, fallback: string): string => {
  const v = str(o, k);
  if (v !== undefined) return v;
  return fallback;
};

const pickNum = (o: YamlRecord, k: string, fallback: number): number => {
  const v = num(o, k);
  if (v !== undefined) return v;
  return fallback;
};

const pickBool = (o: YamlRecord, k: string, fallback: boolean): boolean => {
  const v = bool(o, k);
  if (v !== undefined) return v;
  return fallback;
};

const mergeServer = (raw: YamlRecord | undefined): AgentConfigType['server'] => {
  const o = raw ?? {};
  return {
    wsUrl: pickStr(o, 'ws_url', DEFAULT_AGENT_CONFIG.server.wsUrl),
    graphqlUrl: pickStr(o, 'graphql_url', DEFAULT_AGENT_CONFIG.server.graphqlUrl),
  };
};

const mergeAgent = (raw: YamlRecord | undefined): AgentConfigType['agent'] => {
  const o = raw ?? {};
  return {
    id: pickStr(o, 'id', DEFAULT_AGENT_CONFIG.agent.id),
    heartbeatInterval: pickNum(o, 'heartbeat_interval', DEFAULT_AGENT_CONFIG.agent.heartbeatInterval),
    pollInterval: pickNum(o, 'poll_interval', DEFAULT_AGENT_CONFIG.agent.pollInterval),
  };
};

const mergePlugins = (raw: YamlRecord | undefined): AgentConfigType['plugins'] => {
  const o = raw ?? {};
  return {
    autoSync: pickBool(o, 'auto_sync', DEFAULT_AGENT_CONFIG.plugins.autoSync),
    syncInterval: pickNum(o, 'sync_interval', DEFAULT_AGENT_CONFIG.plugins.syncInterval),
  };
};

const mergeNetwork = (raw: YamlRecord | undefined): AgentConfigType['network'] => {
  const o = raw ?? {};
  return {
    waitAtStartup: pickBool(o, 'wait_at_startup', DEFAULT_AGENT_CONFIG.network.waitAtStartup),
    timeout: pickNum(o, 'timeout', DEFAULT_AGENT_CONFIG.network.timeout),
    checkInterval: pickNum(o, 'check_interval', DEFAULT_AGENT_CONFIG.network.checkInterval),
    checkUrl: pickStr(o, 'check_url', DEFAULT_AGENT_CONFIG.network.checkUrl),
  };
};

const mergeUpdates = (raw: YamlRecord | undefined): AgentConfigType['updates'] => {
  const o = raw ?? {};
  return {
    autoUpdate: pickBool(o, 'auto_update', DEFAULT_AGENT_CONFIG.updates.autoUpdate),
    checkInterval: pickNum(o, 'check_interval', DEFAULT_AGENT_CONFIG.updates.checkInterval),
    updateUrl: pickStr(o, 'update_url', DEFAULT_AGENT_CONFIG.updates.updateUrl),
  };
};

export const buildFromYaml = (loaded: unknown): AgentConfigType => {
  const root = asRecord(loaded) ?? {};
  return {
    server: mergeServer(asRecord(root.server)),
    agent: mergeAgent(asRecord(root.agent)),
    plugins: mergePlugins(asRecord(root.plugins)),
    network: mergeNetwork(asRecord(root.network)),
    updates: mergeUpdates(asRecord(root.updates)),
  };
};

const needsAutoId = (id: string): boolean => {
  if (!id) return true;
  return id.toLowerCase() === 'auto';
};

export const resolveAutoAgentId = (config: AgentConfigType): void => {
  if (!needsAutoId(config.agent.id)) return;
  config.agent.id = getMachineId();
  logger.info(`Auto-detected machine ID: ${config.agent.id}`);
};

export const logConfigError = (e: unknown): void => {
  const msg = e instanceof Error ? e.message : String(e);
  logger.error(`Error loading config: ${msg}`);
};
