import * as fs from 'fs/promises';
import { getMacUsers } from './mac-helpers';

type ListUsersResult = Record<string, unknown>;

function toListError(listed: { success: boolean; error?: string; stderr: string }): string {
  return listed.error ?? listed.stderr ?? 'Failed to list users';
}

async function listDarwinUsers(): Promise<ListUsersResult> {
  const listed = await getMacUsers();
  return listed.success
    ? { success: true, users: listed.users, count: listed.users.length }
    : { success: false, error: toListError(listed) };
}

async function listLinuxUsers(): Promise<ListUsersResult> {
  const file = await fs.readFile('/etc/passwd', 'utf-8');
  const users = file
    .split('\n')
    .map((line) => line.split(':')[0])
    .filter((u) => !!u);
  return { success: true, users, count: users.length };
}

export async function listUsers(): Promise<ListUsersResult> {
  return process.platform === 'darwin' ? listDarwinUsers() : listLinuxUsers();
}
