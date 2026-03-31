import type { AgentTsUpdatePayload, GraphQLClient } from '../../graphql';
import { downloadBundleText } from './download-bundle';
import { writeAgentBundle } from './apply-self-update';
import { getAgentMainPath } from './self-update-path';
import { scheduleAgentRestart } from './schedule-restart';
import { checksumMatches } from './self-update-hash';

const urlFromCommand = (command: Record<string, unknown>): string | undefined => {
  const u = command.url;
  return typeof u === 'string' && u.length > 0 ? u : undefined;
};

const forceFromCommand = (command: Record<string, unknown>): boolean => command.force === true;

const checksumFromCommand = (command: Record<string, unknown>): string | undefined => {
  const c = command.checksum;
  return typeof c === 'string' && c.length > 0 ? c : undefined;
};

const targetVersionFromCommand = (command: Record<string, unknown>): string =>
  typeof command.targetVersion === 'string' ? command.targetVersion : 'unknown';

const finalizeUpdate = (
  body: string,
  checksum: string,
  currentVersion: string,
  newVersion: string
): Record<string, unknown> => {
  writeAgentBundle(getAgentMainPath(), body, checksum);
  scheduleAgentRestart(2000);
  return {
    success: true,
    message: `Updated to ${newVersion}, restarting`,
    oldVersion: currentVersion,
    newVersion,
    restarting: true,
  };
};

const checkUpdatePayload = (info: AgentTsUpdatePayload, currentVersion: string) => ({
  success: true,
  updateAvailable: true,
  currentVersion,
  newVersion: info.version,
  checksum: info.checksum,
  downloadUrl: info.downloadUrl,
});

const buildCheckResult = (info: AgentTsUpdatePayload | null, currentVersion: string): Record<string, unknown> => {
  if (!info) return { success: true, updateAvailable: false, currentVersion };
  return checkUpdatePayload(info, currentVersion);
};

export const runCheckUpdate = async (
  graphql: GraphQLClient,
  currentVersion: string
): Promise<Record<string, unknown>> => {
  const info = await graphql.getAgentTsUpdate(currentVersion, false);
  return buildCheckResult(info, currentVersion);
};

const fetchUrlWithChecksum = async (
  directUrl: string,
  cs: string
): Promise<{ ok: true; body: string } | { ok: false; error: string }> => {
  const body = await downloadBundleText(directUrl);
  if (!checksumMatches(body, cs)) return { ok: false, error: 'Checksum mismatch' };
  return { ok: true, body };
};

const runDirectUrlBody = async (
  command: Record<string, unknown>,
  currentVersion: string,
  directUrl: string
): Promise<Record<string, unknown>> => {
  const cs = checksumFromCommand(command);
  if (!cs) return { success: false, error: 'self_update with url requires checksum (sha256 hex)' };
  const fetched = await fetchUrlWithChecksum(directUrl, cs);
  if (!fetched.ok) return { success: false, error: fetched.error };
  return finalizeUpdate(fetched.body, cs, currentVersion, targetVersionFromCommand(command));
};

const runFromDirectUrl = async (
  command: Record<string, unknown>,
  currentVersion: string
): Promise<Record<string, unknown> | null> => {
  const directUrl = urlFromCommand(command);
  if (!directUrl) return null;
  return runDirectUrlBody(command, currentVersion, directUrl);
};

const applyServerUpdate = async (
  info: AgentTsUpdatePayload,
  currentVersion: string
): Promise<Record<string, unknown>> => {
  const body = await downloadBundleText(info.downloadUrl);
  if (!checksumMatches(body, info.checksum)) return { success: false, error: 'Checksum mismatch' };
  return finalizeUpdate(body, info.checksum, currentVersion, info.version);
};

const runFromGraphql = async (
  graphql: GraphQLClient,
  currentVersion: string,
  force: boolean
): Promise<Record<string, unknown>> => {
  const info = await graphql.getAgentTsUpdate(currentVersion, force);
  if (!info) return { success: true, message: 'No update available', currentVersion };
  return applyServerUpdate(info, currentVersion);
};

const runSelfUpdateBody = async (
  graphql: GraphQLClient,
  currentVersion: string,
  command: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const fromUrl = await runFromDirectUrl(command, currentVersion);
  if (fromUrl) return fromUrl;
  return runFromGraphql(graphql, currentVersion, forceFromCommand(command));
};

export const runSelfUpdate = async (
  graphql: GraphQLClient,
  currentVersion: string,
  command: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  try {
    return await runSelfUpdateBody(graphql, currentVersion, command);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
};
