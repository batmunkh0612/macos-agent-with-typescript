import type { GraphQLClient } from '../../graphql';
import type { PluginManager } from '../../plugin-manager';

export interface CommandServiceConfig {
  agentId: string;
  version: string;
  pollInterval: number;
}

export interface CommandHandler {
  onCommandExecuted?: (_commandId: number, _status: string, _result: unknown) => void;
}

export type CommandHandlerFn = (
  _command?: Record<string, unknown>
) => Promise<Record<string, unknown>> | Record<string, unknown>;

export interface CommandServiceDeps {
  config: CommandServiceConfig;
  graphql: GraphQLClient;
  pluginManager: PluginManager;
  handler: CommandHandler;
}

export interface PendingCommand {
  id: number;
  command: string | Record<string, unknown>;
}
