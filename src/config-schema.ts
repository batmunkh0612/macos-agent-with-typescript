export interface AgentConfigType {
  server: {
    wsUrl: string;
    graphqlUrl: string;
  };
  agent: {
    id: string;
    heartbeatInterval: number;
    pollInterval: number;
  };
  plugins: {
    autoSync: boolean;
    syncInterval: number;
  };
  network: {
    waitAtStartup: boolean;
    timeout: number;
    checkInterval: number;
    checkUrl: string;
  };
  updates: {
    autoUpdate: boolean;
    checkInterval: number;
    updateUrl: string;
  };
}

export const DEFAULT_AGENT_CONFIG: AgentConfigType = {
  server: {
    wsUrl: 'wss://your-worker.workers.dev/ws',
    graphqlUrl: 'https://your-worker.workers.dev/graphql',
  },
  agent: {
    id: 'auto',
    heartbeatInterval: 30,
    pollInterval: 60,
  },
  plugins: {
    autoSync: true,
    syncInterval: 300,
  },
  network: {
    waitAtStartup: true,
    timeout: 120,
    checkInterval: 5,
    checkUrl: 'https://www.google.com',
  },
  updates: {
    autoUpdate: false,
    checkInterval: 3600,
    updateUrl: '',
  },
};
