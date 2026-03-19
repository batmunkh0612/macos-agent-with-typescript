import { createLogger } from '../../utils/logger';
import type { GraphQLClient } from '../../graphql';
import type { CommandHandler } from './types';

const logger = createLogger('CommandService');

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export interface ResultHandlerContext {
  graphql: GraphQLClient;
  handler: CommandHandler;
}

export async function updateAndNotify(
  ctx: ResultHandlerContext,
  cmdId: number,
  status: string,
  result: Record<string, unknown>
): Promise<void> {
  await ctx.graphql.updateCommandStatus(cmdId, status, result);
  if (ctx.handler.onCommandExecuted) {
    ctx.handler.onCommandExecuted(cmdId, status, result);
  }
}

export async function handleCommandResult(
  ctx: ResultHandlerContext,
  cmdId: number,
  result: Record<string, unknown>
): Promise<void> {
  const status = result.success !== false && !result.error ? 'done' : 'failed';
  await updateAndNotify(ctx, cmdId, status, result);
  logger.info(`Command ${cmdId} completed: ${status}`);
}

export async function handleCommandError(
  ctx: ResultHandlerContext,
  cmdId: number,
  e: unknown
): Promise<void> {
  const msg = errorMessage(e);
  logger.error(`Command ${cmdId} failed: ${msg}`);
  await updateAndNotify(ctx, cmdId, 'failed', { error: msg });
}
