const DEFAULT_INTERVAL_MS = 30000;

export interface KeepAliveController {
  start: (_sendPing: () => void, _intervalMs?: number) => void;
  stop: () => void;
}

export function createKeepAlive(): KeepAliveController {
  let intervalId: NodeJS.Timeout | null = null;

  function stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start(sendPing: () => void, intervalMs: number = DEFAULT_INTERVAL_MS): void {
    stop();
    intervalId = setInterval(sendPing, intervalMs);
  }

  return { start, stop };
}

export const KEEP_ALIVE_INTERVAL_MS = DEFAULT_INTERVAL_MS;
