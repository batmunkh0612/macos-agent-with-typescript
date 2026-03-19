import type { CodegenConfig } from '@graphql-codegen/cli';

const schemaUrl =
  process.env.GRAPHQL_SCHEMA_URL ??
  'https://agent-management-platform-service-test.shagai.workers.dev/graphql';

const config: CodegenConfig = {
  overwrite: true,
  schema: schemaUrl,
  documents: ['src/graphql/queries.ts'],
  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
  },
  ignoreNoDocuments: true,
};

export default config;
