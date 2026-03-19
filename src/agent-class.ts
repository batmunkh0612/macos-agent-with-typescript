import * as path from 'path';
import { AgentConfig } from './config';
import { GraphQLClient } from './graphql';
import { PluginManager } from './plugin-manager';
import { HeartbeatService } from './services/heartbeat-service';
import { CommandService } from './services/command-service';
import { WebSocketService } from './services/websocket-service';
import { createLogger } from './utils/logger';

const logger = createLogger('Agent');
const VERSION = '2.1.0-ts';
const RELEASE_DATE = '2026-02-09';
const RELEASE_NOTES =
  'TypeScript port of the remote agent - Refactored with service-oriented architecture';

export class Agent {
  private config: AgentConfig;
  private graphql: GraphQLClient;
  private pluginManager: PluginManager;
  private heartbeatService: HeartbeatService;
  private commandService: CommandService;
  private websocketService: WebSocketService;
  private running = true;
  private agentId: string;
  private version: string;
  private shutdownHandlers: (() => void)[] = [];

  constructor(configFile = 'config.yaml') {
    this.config = new AgentConfig(configFile);
    this.agentId = this.config.get('agent').id;
    this.version = VERSION;

    this.graphql = new GraphQLClient(this.config.get('server').graphql_url);
    this.pluginManager = new PluginManager(path.join(__dirname, 'plugins'));

    this.heartbeatService = new HeartbeatService(
      {
        agentId: this.agentId,
        version: this.version,
        interval: this.config.get('agent').heartbeat_interval,
      },
      this.graphql
    );

    this.commandService = new CommandService(
      {
        agentId: this.agentId,
        version: this.version,
        pollInterval: this.config.get('agent').poll_interval,
      },
      this.graphql,
      this.pluginManager
    );

    this.websocketService = new WebSocketService(
      {
        url: this.config.get('server').ws_url,
        agentId: this.agentId,
        reconnectDelay: 5000,
        maxReconnectDelay: 60000,
        reconnectBackoff: 1.5,
      },
      {
        onNewCommand: async (command) => {
          await this.commandService.executeCommand(
            command as { id: number; command: string | Record<string, unknown> }
          );
        },
        onConnected: () => this.updateServiceStatuses(true),
        onDisconnected: () => this.updateServiceStatuses(false),
      }
    );

    this.shutdownHandlers.push(() => this.heartbeatService.stop());
    this.shutdownHandlers.push(() => this.commandService.stop());
    this.shutdownHandlers.push(() => this.websocketService.stop());

    logger.info('='.repeat(60));
    logger.info(`🤖 Agent v${this.version} initialized`);
    logger.info(`   Agent ID: ${this.agentId}`);
    logger.info(`   Release: ${RELEASE_DATE}`);
    logger.info(`   Notes: ${RELEASE_NOTES}`);
    logger.info('='.repeat(60));
  }

  private updateServiceStatuses(wsConnected: boolean): void {
    this.heartbeatService.setWebSocketStatus(wsConnected);
    this.commandService.setWebSocketStatus(wsConnected);
  }

  private executeShutdownHandlers(): void {
    for (const handler of this.shutdownHandlers) {
      try {
        handler();
      } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e));
        logger.error(`Error during shutdown: ${error.message}`);
      }
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      this.running = false;
      this.executeShutdownHandlers();
      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught exception: ${error.message}`);
      if (error.stack) logger.error(error.stack);
      shutdown('uncaughtException');
    });
  }

  public async start(): Promise<void> {
    logger.info('🚀 Starting agent...');
    logger.info(`Working directory: ${process.cwd()}`);
    await this.pluginManager.loadLocalPlugins();
    this.heartbeatService.start();
    this.commandService.start();
    this.websocketService.start();
    this.setupGracefulShutdown();
    logger.info('✅ Agent started successfully');
  }

  public stop(): void {
    if (!this.running) return;

    logger.info('Stopping agent...');
    this.running = false;
    this.executeShutdownHandlers();
  }

  public isRunning(): boolean {
    return this.running;
  }
}
