import { GraphQLClient } from '../graphql';
import { createLogger } from '../utils/logger';

const logger = createLogger('HeartbeatService');

export interface HeartbeatServiceConfig {
  agentId: string;
  version: string;
  interval: number; // in seconds
}

export class HeartbeatService {
  private config: HeartbeatServiceConfig;
  private graphql: GraphQLClient;
  private intervalId: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private wsConnected: boolean = false;

  constructor(config: HeartbeatServiceConfig, graphql: GraphQLClient) {
    this.config = config;
    this.graphql = graphql;
  }

  public setWebSocketStatus(connected: boolean): void {
    this.wsConnected = connected;
  }

  public start(): void {
    if (this.running) {
      logger.warn('Heartbeat service already running');
      return;
    }

    this.running = true;
    const intervalMs = this.config.interval * 1000;
    
    logger.info(`Starting heartbeat service (interval: ${this.config.interval}s)`);
    
    const sendHeartbeat = async () => {
      if (!this.running) return;
      await this.sendHeartbeatInternal();
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Then send periodically
    this.intervalId = setInterval(sendHeartbeat, intervalMs);
  }

  private async sendHeartbeatInternal(): Promise<void> {
    const status = this.getConnectionStatus();
    
    try {
      await this.graphql.reportHeartbeat(
        this.config.agentId,
        this.config.version,
        status
      );
      logger.debug('Heartbeat sent successfully');
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      logger.error(`Heartbeat failed: ${error.message}`);
    }
  }

  private getConnectionStatus(): string {
    return this.wsConnected ? 'online' : 'polling';
  }

  public stop(): void {
    if (!this.running) {
      return;
    }

    logger.info('Stopping heartbeat service');
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }
}
