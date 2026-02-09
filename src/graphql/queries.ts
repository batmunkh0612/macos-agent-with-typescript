import { gql } from 'graphql-tag';

export const GET_PENDING_COMMANDS = gql`
  query GetCommands($agentId: String!, $limit: Int) {
    getPendingCommands(agentId: $agentId, limit: $limit) {
      id
      command
      priority
    }
  }
`;

export const UPDATE_COMMAND_STATUS = gql`
  mutation UpdateStatus($id: Int!, $status: String!, $result: JSON) {
    updateCommandStatus(id: $id, status: $status, result: $result) {
      id
    }
  }
`;

export const REPORT_HEARTBEAT = gql`
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

export const SYNC_PLUGINS = gql`
  query GetPlugins {
    getPlugins {
      name
      version
      code
      checksum
    }
  }
`;

export const GET_AGENT_STATUS = gql`
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
