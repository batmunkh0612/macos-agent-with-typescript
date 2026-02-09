import { AgentConfig } from './config';
import { GraphQLClient } from './graphql';
import { PluginManager } from './plugin-manager';
import { waitForNetwork } from './utils/network';
import { createLogger } from './utils/logger';
import WebSocket from 'ws';
import * as path from 'path';

const logger = createLogger('Agent');

// Version info (hardcoded for now, mimicking python script)
const VERSION = '2.1.0-ts';
const RELEASE_DATE = '2026-02-09';
const RELEASE_NOTES = 'TypeScript port of the remote agent';

class Agent {
  private config: AgentConfig;
  private graphql: GraphQLClient;
  private pluginManager: PluginManager;
  private ws: WebSocket | null = null;
  private wsConnected: boolean = false;
  private running: boolean = true;
  private agentId: string;
  private version: string;

  constructor(configFile: string = 'config.yaml') {
    this.config = new AgentConfig(configFile);
    this.agentId = this.config.get('agent').id;
    this.version = VERSION;

    this.graphql = new GraphQLClient(this.config.get('server').graphql_url);
    this.pluginManager = new PluginManager(path.join(__dirname, 'plugins'));

    logger.info('='.repeat(60));
    logger.info(`🤖 Agent v${this.version} initialized`);
    logger.info(`   Agent ID: ${this.agentId}`);
    logger.info(`   Release: ${RELEASE_DATE}`);
    logger.info(`   Notes: ${RELEASE_NOTES}`);
    logger.info('='.repeat(60));
  }

  public async start() {
    logger.info('🚀 Starting agent...');
    logger.info(`Working directory: ${process.cwd()}`);
    
    // Load local plugins
    await this.pluginManager.loadLocalPlugins();

    // Initial sync (skipping remote sync for now as per plan, focusing on local)
    // In future: await this.syncPlugins();

    // Start loops
    this.startHeartbeatLoop();
    this.startPollingLoop();
    // this.startPluginSyncLoop(); // derived from python, omitted for now
    this.startAutoUpdateLoop();

    // Start WebSocket
    this.startWebSocket();

    // Keep alive
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      this.running = false;
      if (this.ws) this.ws.close();
      process.exit(0);
    });
  }

  private startHeartbeatLoop() {
    const interval = this.config.get('agent').heartbeat_interval * 1000;
    
    const loop = async () => {
      while (this.running) {
        try {
          await this.graphql.reportHeartbeat(
            this.agentId,
            this.version,
            this.wsConnected ? 'online' : 'polling'
          );
        } catch (e: any) {
          logger.error(`Heartbeat failed: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, interval));
      }
    };
    loop();
  }

  private startPollingLoop() {
    const interval = this.config.get('agent').poll_interval * 1000;

    const loop = async () => {
      while (this.running) {
        if (!this.wsConnected) {
          try {
            await this.pollCommands();
          } catch (e: any) {
            logger.error(`Polling failed: ${e.message}`);
          }
        }
        await new Promise(r => setTimeout(r, interval));
      }
    };
    loop();
  }

  private startAutoUpdateLoop() {
      if (!this.config.get('updates').auto_update) {
          logger.info('Auto-update is disabled');
          return;
      }
      
      const interval = this.config.get('updates').check_interval * 1000;
      logger.info(`Auto-update enabled, checking every ${interval/1000}s`);

      const loop = async () => {
          while (this.running) {
              await new Promise(r => setTimeout(r, interval));
              try {
                  const statusInfo = await this.graphql.getAgentStatus();
                  // Note: getAgentStatus returns an array of all agent statuses
                  // For auto-update, we'd need a different query/approach
                  // Skipping auto-update for now as schema doesn't support it
                  logger.info('Auto-update check: No update mechanism available in current schema');
              } catch (e: any) {
                  logger.error(`Auto-update check failed: ${e.message}`);
              }
          }
      };
      loop();
  }

  private async pollCommands() {
    const commands = await this.graphql.getPendingCommands(this.agentId);
    for (const cmd of commands) {
      await this.executeCommand(cmd);
    }
  }

  private startWebSocket() {
    const wsUrl = this.config.get('server').ws_url;
    const url = `${wsUrl}?agentId=${this.agentId}`;

    logger.info(`Connecting to WebSocket: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      logger.info('✅ WebSocket connected');
      this.wsConnected = true;
      this.pollCommands().catch(e => logger.error(`Failed to check missed commands: ${e.message}`));
    });

    this.ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = data.toString();
        const parsed = JSON.parse(message);
        
        if (parsed.type === 'new_command') {
          await this.executeCommand(parsed.command);
        } else if (parsed.type === 'ping') {
          this.ws?.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e: any) {
        logger.error(`WebSocket message error: ${e.message}`);
      }
    });

    this.ws.on('close', (code, reason) => {
      logger.warn(`WebSocket closed: ${code} - ${reason}`);
      this.wsConnected = false;
      setTimeout(() => {
        if (this.running) this.startWebSocket();
      }, 5000);
    });

    this.ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error.message}`);
      this.wsConnected = false;
    });
  }

  private async executeCommand(cmd: any) {
    const cmdId = cmd.id;
    let command = cmd.command;

    // Handle stringified JSON
    if (typeof command === 'string') {
        try {
            command = JSON.parse(command);
        } catch (e: any) {
            logger.error(`Command ${cmdId} has invalid JSON payload`);
            await this.graphql.updateCommandStatus(cmdId, 'failed', { error: 'Invalid JSON' });
            return;
        }
    }

    const cmdType = command.type;
    logger.info(`Executing command ${cmdId}: ${cmdType}`);

    await this.graphql.updateCommandStatus(cmdId, 'processing');

    try {
        let result: any = null;

        if (cmdType === 'ping') {
            result = { message: 'pong', timestamp: new Date().toISOString() };
        } else if (cmdType === 'list_plugins') {
            result = { success: true, plugins: this.pluginManager.listPlugins() };
        } else if (cmdType === 'get_status') {
             result = {
                success: true,
                agent_id: this.agentId,
                version: this.version,
                uptime: process.uptime(),
                plugins: this.pluginManager.listPlugins(),
                ws_connected: this.wsConnected,
                platform: process.platform
            };
        } else if (['plugin', 'plugin_command'].includes(cmdType)) {
            const pluginName = command.plugin;
            const args = command.args || {};
            if (!pluginName) {
                result = { success: false, error: "Missing 'plugin' field" };
            } else {
                result = await this.pluginManager.executePlugin(pluginName, args);
            }
        } else if (cmdType === 'restart') {
            result = { success: true, message: "Agent restarting..." };
            // TODO: Implement restart logic
        } else {
            result = { error: `Unknown command type: ${cmdType}` };
        }

        const status = (result.success !== false && !result.error) ? 'done' : 'failed';
        await this.graphql.updateCommandStatus(cmdId, status, result);
        logger.info(`Command ${cmdId} completed: ${status}`);

    } catch (e: any) {
        logger.error(`Command ${cmdId} failed: ${e.message}`);
        await this.graphql.updateCommandStatus(cmdId, 'failed', { error: e.message });
    }
  }
}

async function main() {
  const config = new AgentConfig(); // Load config to check network settings
  
  if (config.get('network').wait_at_startup) {
      const { timeout, check_interval, check_url } = config.get('network');
      const networkReady = await waitForNetwork(timeout, check_interval, check_url);
      if (!networkReady) {
          logger.error("Exiting: network not available");
          process.exit(1);
      }
  }

  const agent = new Agent();
  await agent.start();
}

if (require.main === module) {
  main().catch(e => {
      logger.error(`Fatal error: ${e.message}`);
      process.exit(1);
  });
}
