/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** DateTime scalar type */
  DateTime: { input: any; output: any; }
  /** JSON scalar type */
  JSON: { input: any; output: any; }
  _Any: { input: any; output: any; }
  _FieldSet: { input: any; output: any; }
};

export type Agent = {
  __typename?: 'Agent';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: AgentStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type AgentCommand = {
  __typename?: 'AgentCommand';
  agentId: Scalars['String']['output'];
  command: Scalars['JSON']['output'];
  createdAt: Scalars['DateTime']['output'];
  executedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['Int']['output'];
  priority: Scalars['Int']['output'];
  result?: Maybe<Scalars['JSON']['output']>;
  status: Scalars['String']['output'];
};

export type AgentHeartbeat = {
  __typename?: 'AgentHeartbeat';
  agentId: Scalars['String']['output'];
  hostname?: Maybe<Scalars['String']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  lastSeen: Scalars['DateTime']['output'];
  status?: Maybe<Scalars['String']['output']>;
  version?: Maybe<Scalars['String']['output']>;
};

export type AgentPlugin = {
  __typename?: 'AgentPlugin';
  checksum: Scalars['String']['output'];
  code: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['String']['output'];
};

export enum AgentStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Maintenance = 'MAINTENANCE'
}

export type Config = {
  __typename?: 'Config';
  key: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  value: Scalars['JSON']['output'];
};

export type CreateAgentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']['output']>;
  createAgent: Agent;
  createCommand: AgentCommand;
  createOrUpdatePlugin: AgentPlugin;
  deleteAgent: Scalars['Boolean']['output'];
  deletePlugin: Scalars['Boolean']['output'];
  reportHeartbeat: Scalars['Boolean']['output'];
  setConfig: Config;
  updateAgent: Agent;
  updateCommandStatus: AgentCommand;
};


export type MutationCreateAgentArgs = {
  input: CreateAgentInput;
};


export type MutationCreateCommandArgs = {
  agentId: Scalars['String']['input'];
  command: Scalars['JSON']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationCreateOrUpdatePluginArgs = {
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  version: Scalars['String']['input'];
};


export type MutationDeleteAgentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePluginArgs = {
  name: Scalars['String']['input'];
};


export type MutationReportHeartbeatArgs = {
  agentId: Scalars['String']['input'];
  hostname?: InputMaybe<Scalars['String']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  version?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetConfigArgs = {
  key: Scalars['String']['input'];
  value: Scalars['JSON']['input'];
};


export type MutationUpdateAgentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgentInput;
};


export type MutationUpdateCommandStatusArgs = {
  id: Scalars['Int']['input'];
  result?: InputMaybe<Scalars['JSON']['input']>;
  status: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']['output']>;
  _service: _Service;
  agent?: Maybe<Agent>;
  agents: Array<Agent>;
  getAgentStatus: Array<AgentHeartbeat>;
  getAllConfig: Array<Config>;
  getCommandHistory: Array<AgentCommand>;
  getConfig?: Maybe<Config>;
  getOnlineAgents: Array<AgentHeartbeat>;
  getPendingCommands: Array<AgentCommand>;
  getPlugin?: Maybe<AgentPlugin>;
  getPlugins: Array<AgentPlugin>;
};


export type QueryAgentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAgentStatusArgs = {
  agentId?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetCommandHistoryArgs = {
  agentId?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetConfigArgs = {
  key?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetPendingCommandsArgs = {
  agentId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetPluginArgs = {
  name: Scalars['String']['input'];
};

export type UpdateAgentInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AgentStatus>;
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export type GetCommandsQueryVariables = Exact<{
  agentId: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetCommandsQuery = { __typename?: 'Query', getPendingCommands: Array<{ __typename?: 'AgentCommand', id: number, command: any, priority: number }> };

export type UpdateStatusMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  status: Scalars['String']['input'];
  result?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type UpdateStatusMutation = { __typename?: 'Mutation', updateCommandStatus: { __typename?: 'AgentCommand', id: number } };

export type HeartbeatMutationVariables = Exact<{
  agentId: Scalars['String']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  ipAddress?: InputMaybe<Scalars['String']['input']>;
  hostname?: InputMaybe<Scalars['String']['input']>;
}>;


export type HeartbeatMutation = { __typename?: 'Mutation', reportHeartbeat: boolean };

export type GetPluginsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetPluginsQuery = { __typename?: 'Query', getPlugins: Array<{ __typename?: 'AgentPlugin', name: string, version: string, code: string, checksum: string }> };

export type GetAgentStatusQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAgentStatusQuery = { __typename?: 'Query', getAgentStatus: Array<{ __typename?: 'AgentHeartbeat', agentId: string, lastSeen: any, version?: string | null, status?: string | null, ipAddress?: string | null, hostname?: string | null }> };


export const GetCommandsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCommands"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPendingCommands"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"command"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}}]}}]}}]} as unknown as DocumentNode<GetCommandsQuery, GetCommandsQueryVariables>;
export const UpdateStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"result"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCommandStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"result"},"value":{"kind":"Variable","name":{"kind":"Name","value":"result"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UpdateStatusMutation, UpdateStatusMutationVariables>;
export const HeartbeatDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Heartbeat"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"version"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ipAddress"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reportHeartbeat"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"agentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"agentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"version"},"value":{"kind":"Variable","name":{"kind":"Name","value":"version"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"ipAddress"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ipAddress"}}},{"kind":"Argument","name":{"kind":"Name","value":"hostname"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hostname"}}}]}]}}]} as unknown as DocumentNode<HeartbeatMutation, HeartbeatMutationVariables>;
export const GetPluginsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPlugins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getPlugins"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"checksum"}}]}}]}}]} as unknown as DocumentNode<GetPluginsQuery, GetPluginsQueryVariables>;
export const GetAgentStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAgentStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAgentStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agentId"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeen"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"hostname"}}]}}]}}]} as unknown as DocumentNode<GetAgentStatusQuery, GetAgentStatusQueryVariables>;