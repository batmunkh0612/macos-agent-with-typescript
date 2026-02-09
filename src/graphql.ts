import axios from 'axios';
import { createLogger } from './utils/logger';
import * as os from 'os';
import {
  GetCommandsDocument,
  GetCommandsQuery,
  GetCommandsQueryVariables,
  UpdateStatusDocument,
  UpdateStatusMutation,
  UpdateStatusMutationVariables,
  HeartbeatDocument,
  HeartbeatMutation,
  HeartbeatMutationVariables,
  GetPluginsDocument,
  GetPluginsQuery,
  GetAgentStatusDocument,
  GetAgentStatusQuery,
  AgentCommand,
  AgentPlugin,
  AgentHeartbeat,
} from './graphql/generated/graphql';
import { print } from 'graphql';

const logger = createLogger('GraphQLClient');

export class GraphQLClient {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private async execute<TData = any, TVariables = any>(
    document: any,
    variables?: TVariables
  ): Promise<{ data?: TData; errors?: any[] }> {
    try {
      const query = print(document);
      const response = await axios.post(
        this.url,
        {
          query,
          variables: variables || {},
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      if (response.data.errors) {
        logger.error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
        return { errors: response.data.errors };
      }

      return response.data;
    } catch (error: any) {
      logger.error(`GraphQL request failed: ${error.message}`);
      return { errors: [{ message: error.message }] };
    }
  }

  async getPendingCommands(agentId: string, limit: number = 10): Promise<GetCommandsQuery['getPendingCommands']> {
    const result = await this.execute<GetCommandsQuery, GetCommandsQueryVariables>(
      GetCommandsDocument,
      { agentId, limit }
    );
    
    return result.data?.getPendingCommands || [];
  }

  async updateCommandStatus(id: number, status: string, result: any = null): Promise<void> {
    await this.execute<UpdateStatusMutation, UpdateStatusMutationVariables>(
      UpdateStatusDocument,
      { id, status, result }
    );
  }

  async reportHeartbeat(agentId: string, version: string, status: string = 'online'): Promise<void> {
    let ipAddress: string | null = null;
    try {
      const ipRes = await axios.get('https://api.ipify.org', { timeout: 5000 });
      ipAddress = ipRes.data;
    } catch (e) {
      // Ignore
    }

    await this.execute<HeartbeatMutation, HeartbeatMutationVariables>(
      HeartbeatDocument,
      {
        agentId,
        version,
        status,
        ipAddress,
        hostname: os.hostname(),
      }
    );
  }

  async syncPlugins(): Promise<GetPluginsQuery['getPlugins']> {
    const result = await this.execute<GetPluginsQuery>(GetPluginsDocument);
    return result.data?.getPlugins || [];
  }

  async getAgentStatus(): Promise<GetAgentStatusQuery['getAgentStatus']> {
    const result = await this.execute<GetAgentStatusQuery>(GetAgentStatusDocument);
    return result.data?.getAgentStatus || [];
  }
}
