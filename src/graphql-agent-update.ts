import { gql } from 'graphql-tag';

export const GetAgentTsUpdateDocument = gql`
  query GetAgentTsUpdate($currentVersion: String!, $force: Boolean) {
    getAgentTsUpdate(currentVersion: $currentVersion, force: $force) {
      version
      checksum
      downloadUrl
    }
  }
`;

export type AgentTsUpdatePayload = {
  version: string;
  checksum: string;
  downloadUrl: string;
};

export type GetAgentTsUpdateData = {
  getAgentTsUpdate: AgentTsUpdatePayload | null;
};

type GraphQLErrorResult = { message: string };

export const parseTsUpdateResult = (result: {
  data?: GetAgentTsUpdateData;
  errors?: GraphQLErrorResult[];
}): AgentTsUpdatePayload | null => {
  if (result.errors) return null;
  return result.data?.getAgentTsUpdate ?? null;
};

export type GetAgentTsUpdateVariables = {
  currentVersion: string;
  force?: boolean | null;
};
