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
} from './graphql/generated/graphql';
import { print } from 'graphql';

const logger = createLogger('GraphQLClient');
const REQUEST_TIMEOUT_MS = 30000;

type GraphQLErrorResult = {
  message: string;
};

export class GraphQLClient {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  private async postRequest<TVariables extends Record<string, unknown>>(
    document: unknown,
    variables?: TVariables
  ) {
    const query = print(document as never);
    return axios.post(
      this.url,
      {
        query,
        variables: variables || {},
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
  }

  private parseResponse<TData>(payload: { data?: TData; errors?: GraphQLErrorResult[] }) {
    if (payload.errors) {
      logger.error(`GraphQL errors: ${JSON.stringify(payload.errors)}`);
      return { errors: payload.errors };
    }
    return payload;
  }

  private async execute<TData, TVariables extends Record<string, unknown>>(
    document: unknown,
    variables?: TVariables
  ): Promise<{ data?: TData; errors?: GraphQLErrorResult[] }> {
    try {
      const response = await this.postRequest(document, variables);
      return this.parseResponse(response.data as { data?: TData; errors?: GraphQLErrorResult[] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`GraphQL request failed: ${message}`);
      return { errors: [{ message }] };
    }
  }

  async getPendingCommands(agentId: string, limit: number = 10): Promise<GetCommandsQuery['getPendingCommands']> {
    const result = await this.execute<GetCommandsQuery, GetCommandsQueryVariables>(
      GetCommandsDocument,
      { agentId, limit }
    );
    
    return result.data?.getPendingCommands || [];
  }

  async updateCommandStatus(id: number, status: string, result: unknown = null): Promise<void> {
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
    } catch {
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
    const result = await this.execute<GetPluginsQuery, Record<string, unknown>>(GetPluginsDocument);
    return result.data?.getPlugins || [];
  }

  async getAgentStatus(): Promise<GetAgentStatusQuery['getAgentStatus']> {
    const result = await this.execute<GetAgentStatusQuery, Record<string, unknown>>(GetAgentStatusDocument);
    return result.data?.getAgentStatus || [];
  }
}
