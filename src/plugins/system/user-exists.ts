import { execPromise, isValidUsername } from './utils';
import { getMacUsers } from './mac-helpers';
import type { SystemArgs } from './types';

type UserExistsResult = Record<string, unknown>;

function validateUsername(args: SystemArgs): string | undefined {
  if (!args.username) return 'Username required';
  if (!isValidUsername(args.username)) return 'Invalid username format';
  return undefined;
}

function darwinExistsError(users: { success: boolean; error?: string; stderr: string }): string {
  return users.error ?? users.stderr ?? 'Failed to list users';
}

async function checkDarwinUserExists(username: string): Promise<UserExistsResult> {
  const users = await getMacUsers();
  return users.success
    ? { success: true, username, exists: users.users.includes(username) }
    : { success: false, error: darwinExistsError(users) };
}

async function checkLinuxUserExists(username: string): Promise<UserExistsResult> {
  const result = await execPromise(`id ${username}`);
  return { success: true, username, exists: result.success };
}

export async function userExists(args: SystemArgs): Promise<UserExistsResult> {
  const err = validateUsername(args);
  if (err) return { error: err };
  const username = args.username as string;
  return process.platform === 'darwin'
    ? checkDarwinUserExists(username)
    : checkLinuxUserExists(username);
}
