/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetCommands($agentId: String!, $limit: Int) {\n    getPendingCommands(agentId: $agentId, limit: $limit) {\n      id\n      command\n      priority\n    }\n  }\n": typeof types.GetCommandsDocument,
    "\n  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {\n    updateCommandStatus(id: $id, status: $status, result: $result) {\n      id\n    }\n  }\n": typeof types.UpdateStatusDocument,
    "\n  mutation Heartbeat(\n    $agentId: String!\n    $version: String\n    $status: String\n    $ipAddress: String\n    $hostname: String\n  ) {\n    reportHeartbeat(\n      agentId: $agentId\n      version: $version\n      status: $status\n      ipAddress: $ipAddress\n      hostname: $hostname\n    )\n  }\n": typeof types.HeartbeatDocument,
    "\n  query GetPlugins {\n    getPlugins {\n      name\n      version\n      code\n      checksum\n    }\n  }\n": typeof types.GetPluginsDocument,
    "\n  query GetAgentStatus {\n    getAgentStatus {\n      agentId\n      lastSeen\n      version\n      status\n      ipAddress\n      hostname\n    }\n  }\n": typeof types.GetAgentStatusDocument,
};
const documents: Documents = {
    "\n  query GetCommands($agentId: String!, $limit: Int) {\n    getPendingCommands(agentId: $agentId, limit: $limit) {\n      id\n      command\n      priority\n    }\n  }\n": types.GetCommandsDocument,
    "\n  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {\n    updateCommandStatus(id: $id, status: $status, result: $result) {\n      id\n    }\n  }\n": types.UpdateStatusDocument,
    "\n  mutation Heartbeat(\n    $agentId: String!\n    $version: String\n    $status: String\n    $ipAddress: String\n    $hostname: String\n  ) {\n    reportHeartbeat(\n      agentId: $agentId\n      version: $version\n      status: $status\n      ipAddress: $ipAddress\n      hostname: $hostname\n    )\n  }\n": types.HeartbeatDocument,
    "\n  query GetPlugins {\n    getPlugins {\n      name\n      version\n      code\n      checksum\n    }\n  }\n": types.GetPluginsDocument,
    "\n  query GetAgentStatus {\n    getAgentStatus {\n      agentId\n      lastSeen\n      version\n      status\n      ipAddress\n      hostname\n    }\n  }\n": types.GetAgentStatusDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetCommands($agentId: String!, $limit: Int) {\n    getPendingCommands(agentId: $agentId, limit: $limit) {\n      id\n      command\n      priority\n    }\n  }\n"): (typeof documents)["\n  query GetCommands($agentId: String!, $limit: Int) {\n    getPendingCommands(agentId: $agentId, limit: $limit) {\n      id\n      command\n      priority\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {\n    updateCommandStatus(id: $id, status: $status, result: $result) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {\n    updateCommandStatus(id: $id, status: $status, result: $result) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Heartbeat(\n    $agentId: String!\n    $version: String\n    $status: String\n    $ipAddress: String\n    $hostname: String\n  ) {\n    reportHeartbeat(\n      agentId: $agentId\n      version: $version\n      status: $status\n      ipAddress: $ipAddress\n      hostname: $hostname\n    )\n  }\n"): (typeof documents)["\n  mutation Heartbeat(\n    $agentId: String!\n    $version: String\n    $status: String\n    $ipAddress: String\n    $hostname: String\n  ) {\n    reportHeartbeat(\n      agentId: $agentId\n      version: $version\n      status: $status\n      ipAddress: $ipAddress\n      hostname: $hostname\n    )\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetPlugins {\n    getPlugins {\n      name\n      version\n      code\n      checksum\n    }\n  }\n"): (typeof documents)["\n  query GetPlugins {\n    getPlugins {\n      name\n      version\n      code\n      checksum\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetAgentStatus {\n    getAgentStatus {\n      agentId\n      lastSeen\n      version\n      status\n      ipAddress\n      hostname\n    }\n  }\n"): (typeof documents)["\n  query GetAgentStatus {\n    getAgentStatus {\n      agentId\n      lastSeen\n      version\n      status\n      ipAddress\n      hostname\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;