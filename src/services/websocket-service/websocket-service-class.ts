import WebSocket from 'ws';
import { createLogger } from '../../utils/logger';
import { serializeMessage, parseIncomingMessage, processMessage, errorMessage } from './message';
import { createKeepAlive, KEEP_ALIVE_INTERVAL_MS } from './keep-alive';
import { createReconnectScheduler } from './reconnect';
import type { WebSocketServiceConfig, WebSocketMessageHandler } from './types';

const logger = createLogger('WebSocketService');

export class WebSocketService {
  private config: WebSocketServiceConfig;
  private ws: WebSocket | null = null;
  private connected = false;
  private running = false;
  private handler: WebSocketMessageHandler;
  private keepAlive = createKeepAlive();
  private reconnectScheduler: ReturnType<typeof createReconnectScheduler>;

  constructor(config: WebSocketServiceConfig, handler: WebSocketMessageHandler = {}) {
    this.config = config;
    this.handler = handler;
    this.reconnectScheduler = createReconnectScheduler(config);
  }

  public start(): void {
    if (this.running) {
      logger.warn('WebSocket service already running');
      return;
    }
    this.running = true;
    this.connect();
  }

  public stop(): void {
    if (!this.running) return;
    logger.info('Stopping WebSocket service');
    this.running = false;
    this.cleanup();
  }

  private cleanup(): void {
    this.reconnectScheduler.cancel();
    this.keepAlive.stop();
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public send(message: Record<string, unknown> | string): boolean {
    if (!this.connected || !this.ws) {
      logger.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    return this.trySend(message);
  }

  private trySend(message: Record<string, unknown> | string): boolean {
    try {
      (this.ws as WebSocket).send(serializeMessage(message));
      return true;
    } catch (e: unknown) {
      logger.error(`Failed to send WebSocket message: ${errorMessage(e)}`);
      return false;
    }
  }

  private connect(): void {
    if (!this.running) return;
    const url = `${this.config.url}?agentId=${this.config.agentId}`;
    logger.info(`Connecting to WebSocket: ${url}`);
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (e: unknown) {
      this.handleConnectionError(e);
    }
  }

  private setupEventHandlers(): void {
    const ws = this.ws as WebSocket;
    ws.on('open', () => this.handleOpen());
    ws.on('message', (data: WebSocket.Data) => this.handleMessage(data));
    ws.on('close', (code: number, reason: Buffer) => this.handleClose(code, reason));
    ws.on('error', (error: Error) => this.handleError(error));
  }

  private handleOpen(): void {
    logger.info('✅ WebSocket connected');
    this.connected = true;
    this.reconnectScheduler.resetDelay();
    this.keepAlive.start(() => {
      if (this.connected && this.ws) this.send({ type: 'ping' });
    }, KEEP_ALIVE_INTERVAL_MS);
    if (this.handler.onConnected) this.handler.onConnected();
  }

  private async handleMessage(data: WebSocket.Data): Promise<void> {
    const parsed = parseIncomingMessage(data.toString());
    if (!parsed) {
      logger.error('WebSocket message error: invalid JSON');
      return;
    }
    const sendPong = () => this.send({ type: 'pong' });
    await processMessage(parsed, this.handler, sendPong);
  }

  private handleClose(_code: number, reason: Buffer): void {
    logger.warn(`WebSocket closed: ${reason.toString()}`);
    this.disconnect();
    if (this.handler.onDisconnected) this.handler.onDisconnected();
    if (this.running) this.reconnectScheduler.schedule(() => this.connect(), () => this.running);
  }

  private handleError(error: Error): void {
    logger.error(`WebSocket error: ${error.message}`);
    this.disconnect();
  }

  private disconnect(): void {
    this.connected = false;
    this.keepAlive.stop();
  }

  private handleConnectionError(e: unknown): void {
    logger.error(`Failed to create WebSocket connection: ${errorMessage(e)}`);
    if (this.running) this.reconnectScheduler.schedule(() => this.connect(), () => this.running);
  }
}
