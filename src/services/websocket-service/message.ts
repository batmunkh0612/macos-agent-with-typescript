import { createLogger } from '../../utils/logger';
import type { WebSocketMessageHandler } from './types';

const logger = createLogger('WebSocketService');

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function serializeMessage(message: Record<string, unknown> | string): string {
  return typeof message === 'string' ? message : JSON.stringify(message);
}

export function parseIncomingMessage(data: string): Record<string, unknown> | null {
  try {
    return JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const typeNewCommand = 'new_command';
const typePing = 'ping';

async function handleNewCommandMessage(
  parsed: Record<string, unknown>,
  handler: WebSocketMessageHandler
): Promise<void> {
  if (!handler.onNewCommand) return;
  const cmd = (parsed.command ?? {}) as Record<string, unknown>;
  await handler.onNewCommand(cmd);
}

function handlePingMessage(handler: WebSocketMessageHandler, sendPong: () => boolean): void {
  sendPong();
  if (handler.onPing) handler.onPing();
}

export async function processMessage(
  parsed: Record<string, unknown>,
  handler: WebSocketMessageHandler,
  sendPong: () => boolean
): Promise<void> {
  if (parsed.type === typeNewCommand) {
    await handleNewCommandMessage(parsed, handler);
  } else if (parsed.type === typePing) {
    handlePingMessage(handler, sendPong);
  } else {
    logger.debug(`Received unknown message type: ${String(parsed.type)}`);
  }
}
