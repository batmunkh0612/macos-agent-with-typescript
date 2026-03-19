import { rootCmd, execPromise, sleep } from './utils';
import type { MacUserState, SecureTokenStatus } from './types';

export async function getMacUsers(): Promise<{
  success: boolean;
  users: string[];
  stderr: string;
  error?: string;
}> {
  const result = await execPromise('dscl . -list /Users', { timeout: 10000 });
  if (!result.success) {
    return { success: false, users: [], stderr: result.stderr, error: result.error };
  }
  const users = result.stdout
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && !u.startsWith('_'));
  return { success: true, users, stderr: result.stderr };
}

function listedIncludes(listed: { success: boolean; users: string[] }, username: string): boolean {
  return listed.success && listed.users.includes(username);
}

function computeListError(listed: { success: boolean; error?: string; stderr: string }): string | undefined {
  return listed.success ? undefined : (listed.error ?? listed.stderr);
}

function isListedOnly(
  listedUser: boolean,
  readResult: { success: boolean },
  idResult: { success: boolean }
): boolean {
  return listedUser && !readResult.success && !idResult.success;
}

function toMacUserState(
  username: string,
  readResult: { success: boolean },
  listed: { success: boolean; users: string[]; error?: string; stderr: string },
  idResult: { success: boolean }
): MacUserState {
  const listedUser = listedIncludes(listed, username);
  const exists = readResult.success || idResult.success;
  const listedOnly = isListedOnly(listedUser, readResult, idResult);
  return {
    exists,
    listed: listedUser,
    dsclReadable: readResult.success,
    idResolves: idResult.success,
    listedOnly,
    listError: computeListError(listed),
  };
}

export async function getMacUserState(username: string): Promise<MacUserState> {
  const readResult = await execPromise(`dscl . -read /Users/${username}`, { timeout: 10000 });
  const listed = await getMacUsers();
  const idResult = await execPromise(`id ${username}`, { timeout: 10000 });
  return toMacUserState(username, readResult, listed, idResult);
}

export async function getMacSecureTokenStatus(username: string): Promise<SecureTokenStatus> {
  const tokenStatusResult = await execPromise(rootCmd(`sysadminctl -secureTokenStatus ${username}`), {
    timeout: 10000,
  });
  const raw = `${tokenStatusResult.stdout}\n${tokenStatusResult.stderr}`;
  const output = raw.toUpperCase();
  if (output.includes('ENABLED')) {
    return { enabled: true, known: true, raw };
  }
  if (output.includes('DISABLED')) {
    return { enabled: false, known: true, raw };
  }
  return { enabled: false, known: false, raw };
}

export async function terminateMacUserSession(username: string): Promise<void> {
  const uidResult = await execPromise(`id -u ${username}`, { timeout: 10000 });
  if (!uidResult.success) return;

  const uid = uidResult.stdout.trim();
  if (!/^\d+$/.test(uid)) return;

  await execPromise(rootCmd(`launchctl bootout user/${uid}`), { timeout: 10000 });
  await execPromise(rootCmd(`pkill -TERM -u ${uid}`), { timeout: 10000 });
  await sleep(1000);
  await execPromise(rootCmd(`pkill -KILL -u ${uid}`), { timeout: 10000 });
}

export async function refreshMacDirectoryServicesCache(): Promise<void> {
  await execPromise(rootCmd('dscacheutil -flushcache'), { timeout: 10000 });
  await execPromise(rootCmd('killall opendirectoryd'), { timeout: 10000 });
  await sleep(1000);
}

export async function waitForMacUserState(username: string): Promise<MacUserState> {
  const retries = 8;
  const delayMs = 2000;
  let lastState = await getMacUserState(username);
  for (let i = 1; i < retries && lastState.exists; i++) {
    await sleep(delayMs);
    lastState = await getMacUserState(username);
  }
  return lastState;
}
