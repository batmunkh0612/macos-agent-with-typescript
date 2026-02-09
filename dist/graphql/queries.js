"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_AGENT_STATUS = exports.SYNC_PLUGINS = exports.REPORT_HEARTBEAT = exports.UPDATE_COMMAND_STATUS = exports.GET_PENDING_COMMANDS = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.GET_PENDING_COMMANDS = (0, graphql_tag_1.gql) `
  query GetCommands($agentId: String!, $limit: Int) {
    getPendingCommands(agentId: $agentId, limit: $limit) {
      id
      command
      priority
    }
  }
`;
exports.UPDATE_COMMAND_STATUS = (0, graphql_tag_1.gql) `
  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {
    updateCommandStatus(id: $id, status: $status, result: $result) {
      id
    }
  }
`;
exports.REPORT_HEARTBEAT = (0, graphql_tag_1.gql) `
  mutation Heartbeat(
    $agentId: String!
    $version: String
    $status: String
    $ipAddress: String
    $hostname: String
  ) {
    reportHeartbeat(
      agentId: $agentId
      version: $version
      status: $status
      ipAddress: $ipAddress
      hostname: $hostname
    )
  }
`;
exports.SYNC_PLUGINS = (0, graphql_tag_1.gql) `
  query GetPlugins {
    getPlugins {
      name
      version
      code
      checksum
    }
  }
`;
exports.GET_AGENT_STATUS = (0, graphql_tag_1.gql) `
  query GetAgentStatus {
    getAgentStatus {
      agentId
      lastSeen
      version
      status
      ipAddress
      hostname
    }
  }
`;
