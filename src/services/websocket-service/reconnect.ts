import { createLogger } from '../../utils/logger';
import type { WebSocketServiceConfig } from './types';

const logger = createLogger('WebSocketService');

export interface ReconnectScheduler {
  schedule: (_connect: () => void, _getRunning: () => boolean) => void;
  cancel: () => void;
  resetDelay: () => void;
}

export function createReconnectScheduler(config: WebSocketServiceConfig): ReconnectScheduler {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentDelay = config.reconnectDelay;

  function cancel(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function resetDelay(): void {
    currentDelay = config.reconnectDelay;
  }

  function schedule(connect: () => void, getRunning: () => boolean): void {
    if (!getRunning()) return;
    cancel();
    logger.info(`Scheduling reconnect in ${currentDelay}ms`);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (getRunning()) connect();
      currentDelay = Math.min(
        currentDelay * config.reconnectBackoff,
        config.maxReconnectDelay
      );
    }, currentDelay);
  }

  return { schedule, cancel, resetDelay };
}
