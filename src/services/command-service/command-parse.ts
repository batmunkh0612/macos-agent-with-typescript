import { createLogger } from '../../utils/logger';

const logger = createLogger('CommandService');

export type UpdateAndNotifyFn = (
  _cmdId: number,
  _status: string,
  _result: Record<string, unknown>
) => Promise<void>;

export async function parseCommand(
  cmdId: number,
  command: string | Record<string, unknown>,
  updateAndNotify: UpdateAndNotifyFn
): Promise<Record<string, unknown> | null> {
  if (typeof command !== 'string') return command as Record<string, unknown>;
  try {
    return JSON.parse(command) as Record<string, unknown>;
  } catch {
    logger.error(`Command ${cmdId} has invalid JSON payload`);
    await updateAndNotify(cmdId, 'failed', { error: 'Invalid JSON' });
    return null;
  }
}
