import type { GraphQLClient } from '../../graphql';
import type { PluginManager } from '../../plugin-manager';
import { createLogger } from '../../utils/logger';
import { buildCommandHandlers, buildStatusResponse } from './command-handlers';
import { parseCommand } from './command-parse';
import { processCommand } from './command-process';
import { handleCommandResult, handleCommandError, errorMessage, updateAndNotify } from './command-result';
import type { CommandServiceConfig, CommandHandler, PendingCommand } from './types';
import type { ResultHandlerContext } from './command-result';

const logger = createLogger('CommandService');

export class CommandService {
  private config: CommandServiceConfig;
  private graphql: GraphQLClient;
  private pluginManager: PluginManager;
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;
  private wsConnected = false;
  private handler: CommandHandler;
  private commandHandlers: Map<string, (_cmd: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>>;
  private resultCtx: ResultHandlerContext;
  private inFlightCommandIds = new Set<number>();

  constructor(
    config: CommandServiceConfig,
    graphql: GraphQLClient,
    pluginManager: PluginManager,
    handler: CommandHandler = {}
  ) {
    this.config = config;
    this.graphql = graphql;
    this.pluginManager = pluginManager;
    this.handler = handler;
    this.resultCtx = { graphql, handler };
    const getStatus = () => this.getStatusResponse();
    this.commandHandlers = buildCommandHandlers(pluginManager, getStatus);
  }

  private getStatusResponse(): Record<string, unknown> {
    return buildStatusResponse({
      agentId: this.config.agentId,
      version: this.config.version,
      wsConnected: this.wsConnected,
      listPlugins: () => this.pluginManager.listPlugins(),
    });
  }

  public setWebSocketStatus(connected: boolean): void {
    const wasConnected = this.wsConnected;
    this.wsConnected = connected;
    if (wasConnected && !connected && this.running) {
      // Recover quickly when websocket drops instead of waiting for next interval.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.pollWithErrorHandling();
    }
  }

  public start(): void {
    if (this.running) {
      logger.warn('Command service already running');
      return;
    }
    this.running = true;
    const intervalMs = this.config.pollInterval * 1000;
    logger.info(`Starting command polling service (interval: ${this.config.pollInterval}s)`);
    const pollCommands = async () => {
      if (!this.shouldPoll()) return;
      await this.pollWithErrorHandling();
    };
    pollCommands();
    this.intervalId = setInterval(pollCommands, intervalMs);
  }

  private shouldPoll(): boolean {
    return this.running && !this.wsConnected;
  }

  private async pollWithErrorHandling(): Promise<void> {
    try {
      await this.pollAndExecuteCommands();
    } catch (e: unknown) {
      logger.error(`Command polling failed: ${errorMessage(e)}`);
    }
  }

  public stop(): void {
    if (!this.running) return;
    logger.info('Stopping command service');
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async pollAndExecuteCommands(): Promise<void> {
    const commands = await this.graphql.getPendingCommands(this.config.agentId);
    if (commands.length > 0) logger.info(`Found ${commands.length} pending command(s)`);
    for (const cmd of commands) await this.executeCommand(cmd as PendingCommand);
  }

  private isInFlight(cmdId: number): boolean {
    return this.inFlightCommandIds.has(cmdId);
  }

  private markInFlight(cmdId: number): void {
    this.inFlightCommandIds.add(cmdId);
  }

  private clearInFlight(cmdId: number): void {
    this.inFlightCommandIds.delete(cmdId);
  }

  private asNonEmptyString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private resolveCommandType(command: Record<string, unknown>): string {
    const explicit = this.asNonEmptyString(command.type);
    if (explicit) return explicit;
    const pluginName = this.asNonEmptyString(command.plugin);
    if (pluginName) return 'plugin';
    return 'unknown';
  }

  private async executeCommandCore(cmd: PendingCommand): Promise<void> {
    const notify = (cmdId: number, status: string, result: Record<string, unknown>) =>
      updateAndNotify(this.resultCtx, cmdId, status, result);
    const command = await parseCommand(cmd.id, cmd.command, notify);
    if (!command) return;

    const cmdType = this.resolveCommandType(command);
    logger.info(`Executing command ${cmd.id}: ${cmdType}`);
    await this.graphql.updateCommandStatus(cmd.id, 'processing');

    const result = await processCommand(cmdType, command, this.pluginManager, this.commandHandlers);
    await handleCommandResult(this.resultCtx, cmd.id, result);
  }

  public async executeCommand(cmd: PendingCommand): Promise<void> {
    if (this.isInFlight(cmd.id)) {
      logger.debug(`Skipping duplicate in-flight command ${cmd.id}`);
      return;
    }
    this.markInFlight(cmd.id);
    try {
      await this.executeCommandCore(cmd);
    } catch (e: unknown) {
      await handleCommandError(this.resultCtx, cmd.id, e);
    } finally {
      this.clearInFlight(cmd.id);
    }
  }

  public isRunning(): boolean {
    return this.running;
  }
}
