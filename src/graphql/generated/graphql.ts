export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
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
  DateTime: { input: any; output: any; }
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

export type BatchCommandResult = {
  __typename?: 'BatchCommandResult';
  commands: Array<AgentCommand>;
  errors?: Maybe<Array<Scalars['String']['output']>>;
  success: Scalars['Boolean']['output'];
  totalAgents: Scalars['Int']['output'];
};

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
  /** Send command to multiple agents at once */
  batchCommand: BatchCommandResult;
  /** Broadcast command to ALL online agents */
  broadcastCommand: BatchCommandResult;
  /** Change wallpaper on a single agent by sending a wallpaper plugin command */
  changeAgentWallpaper: AgentCommand;
  createAgent: Agent;
  /** Send command to a single agent */
  createCommand: AgentCommand;
  createOrUpdatePlugin: AgentPlugin;
  deleteAgent: Scalars['Boolean']['output'];
  deletePlugin: Scalars['Boolean']['output'];
  reportHeartbeat: Scalars['Boolean']['output'];
  setConfig: Config;
  updateAgent: Agent;
  updateCommandStatus: AgentCommand;
};


export type MutationBatchCommandArgs = {
  agentIds: Array<Scalars['String']['input']>;
  command: Scalars['JSON']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationBroadcastCommandArgs = {
  command: Scalars['JSON']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationChangeAgentWallpaperArgs = {
  agentId: Scalars['String']['input'];
  imagePath: Scalars['String']['input'];
  priority?: InputMaybe<Scalars['Int']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
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
