export interface WebSocketServiceConfig {
  url: string;
  agentId: string;
  reconnectDelay: number;
  maxReconnectDelay: number;
  reconnectBackoff: number;
}

export interface WebSocketMessageHandler {
  onNewCommand?: (_command: Record<string, unknown>) => Promise<void>;
  onPing?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}
