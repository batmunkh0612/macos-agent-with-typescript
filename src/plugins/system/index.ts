import { createLogger } from '../../utils/logger';
import { createUser } from './create-user';
import { deleteUser } from './delete-user';
import { listUsers } from './list-users';
import { getSystemInfo } from './system-info';
import type { SystemArgs } from './types';
import { userExists } from './user-exists';

const logger = createLogger('Plugin.System');

export type { ExecResult, MacUserState, SecureTokenStatus, SystemArgs } from './types';
export { createUser, deleteUser, getSystemInfo, listUsers, userExists };

const actionCreateUser = 'create_user';
const actionDeleteUser = 'delete_user';
const actionListUsers = 'list_users';
const actionUserExists = 'user_exists';

const actionHandlers: Record<
  string,
  (_args: SystemArgs) => Promise<Record<string, unknown>>
> = {
  [actionCreateUser]: createUser,
  [actionDeleteUser]: deleteUser,
  [actionListUsers]: () => listUsers(),
  [actionUserExists]: userExists,
};

async function dispatchAction(args: SystemArgs): Promise<Record<string, unknown>> {
  const handler = actionHandlers[args.action as string];
  if (handler) return handler(args);
  return { error: `Unknown action: ${args.action}` };
}

async function runHandle(args: SystemArgs): Promise<Record<string, unknown>> {
  if (args.info) return await getSystemInfo(args.info);
  if (args.action) return await dispatchAction(args);
  return { error: 'Missing info or action argument' };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const handle = async (args: SystemArgs): Promise<Record<string, unknown>> => {
  try {
    return await runHandle(args);
  } catch (e: unknown) {
    logger.error(`System plugin error: ${errorMessage(e)}`);
    return { error: errorMessage(e) };
  }
};
