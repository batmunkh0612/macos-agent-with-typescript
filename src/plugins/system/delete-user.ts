import type { SystemArgs } from './types';
import { execPromise, isValidUsername, rootCmd } from './utils';

type DeleteUserResult = {
  stdout?: string;
  stderr?: string;
  error?: string;
  [key: string]: unknown;
};

type ValidatedArgs = {
  username: string;
  admin_user: string;
  admin_password: string;
};

function hasRequiredFields(args: SystemArgs): args is ValidatedArgs {
  return !!(args.username && args.admin_user && args.admin_password);
}

function validateDeleteUserArgs(args: SystemArgs): string | undefined {
  if (!hasRequiredFields(args)) {
    return 'Username, admin_user, and admin_password required';
  }
  if (!isValidUsername(args.username)) {
    return 'Invalid username format';
  }
  return undefined;
}

function buildDeleteUserCmd(
  username: string,
  adminUser: string,
  adminPassword: string
): string {
  return rootCmd(
    `sysadminctl -adminUser ${adminUser} -adminPassword ${adminPassword} -deleteUser ${username}`
  );
}

export async function deleteUser(args: SystemArgs): Promise<DeleteUserResult> {
  const validationError = validateDeleteUserArgs(args);
  if (validationError) return { error: validationError };

  const { username, admin_user: adminUser, admin_password: adminPassword } = args as ValidatedArgs;
  const cmd = buildDeleteUserCmd(username, adminUser, adminPassword);
  const result = await execPromise(cmd);
  return { ...result };
}