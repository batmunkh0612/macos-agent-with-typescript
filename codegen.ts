import type { CodegenConfig } from '@graphql-codegen/cli';

// Note: Replace with your actual GraphQL endpoint or schema file
const schemaUrl = process.env.GRAPHQL_ENDPOINT || "https://agent-management-platform-service-test.shagai.workers.dev/";

const config: CodegenConfig = {
  overwrite: true,
  schema: schemaUrl,
  documents: "src/graphql/**/*.ts",
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      plugins: [],
      presetConfig: {
        gqlTagName: "gql",
      }
    }
  },
  ignoreNoDocuments: true,
};

export default config;
