import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('Plugin.Wallpaper');
const execAsync = promisify(exec);

interface WallpaperArgs {
  action: 'set';
  image_path?: string;
  username?: string;
}

interface PluginResult {
  success: boolean;
  error?: string;
  username?: string;
  message?: string;
  [key: string]: unknown;
}

const actionSet = 'set';
const URL_TIMEOUT_MS = 30000;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
function platformError(): PluginResult | null {
  return process.platform !== 'darwin'
    ? { success: false, error: 'Wallpaper is only supported on macOS' }
    : null;
}

function pathError(imagePath: string | undefined): PluginResult | null {
  return !imagePath ? { success: false, error: 'image_path is required' } : null;
}
async function ensureImageExists(imagePath: string): Promise<PluginResult | null> {
  try {
    await fs.access(imagePath);
    return null;
  } catch {
    return { success: false, error: `Image file not found: ${imagePath}` };
  }
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
function tempFilePathFromUrl(imageUrl: string): string {
  const parsed = new URL(imageUrl);
  const ext = path.extname(parsed.pathname) || '.jpg';
  const filename = `agent-wallpaper-${Date.now()}${ext}`;
  return path.join(os.tmpdir(), filename);
}

async function downloadImageFromUrl(imageUrl: string): Promise<string> {
  const targetPath = tempFilePathFromUrl(imageUrl);
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: 'arraybuffer',
    timeout: URL_TIMEOUT_MS,
  });
  await fs.writeFile(targetPath, Buffer.from(response.data));
  return targetPath;
}

function getSyncValidationError(args: WallpaperArgs): PluginResult | null {
  const platformErr = platformError();
  if (platformErr) return platformErr;
  return pathError(args.image_path);
}

async function firstValidationError(args: WallpaperArgs): Promise<PluginResult | null> {
  const syncErr = getSyncValidationError(args);
  if (syncErr) return syncErr;
  const imagePath = args.image_path as string;
  if (isHttpUrl(imagePath)) return null;
  return await ensureImageExists(imagePath);
}

async function resolveImagePath(rawImagePath: string): Promise<string> {
  return isHttpUrl(rawImagePath)
    ? await downloadImageFromUrl(rawImagePath)
    : rawImagePath;
}

function fallbackUser(consoleUser: string | null): string {
  return consoleUser ?? os.userInfo().username;
}

async function runSet(args: WallpaperArgs): Promise<PluginResult> {
  const err = await firstValidationError(args);
  if (err) return err;
  const rawImagePath = args.image_path as string;
  const imagePath = await resolveImagePath(rawImagePath);
  const consoleUser = await getConsoleUser();
  const username = args.username ?? fallbackUser(consoleUser);
  logger.info(`Setting wallpaper for user: ${username}, image: ${imagePath}`);
  return setWallpaperMac(imagePath, username);
}
function isValidConsoleUser(user: string): boolean {
  return user.length > 0 && user !== 'root';
}

async function getConsoleUser(): Promise<string | null> {
  try {
    const { stdout } = await execAsync('stat -f %Su /dev/console');
    const user = stdout.trim();
    return isValidConsoleUser(user) ? user : null;
  } catch {
    return null;
  }
}
function buildScripts(imagePath: string): string[] {
  const escaped = imagePath.replace(/"/g, '\\"');
  return [
    `tell application "System Events"\n  tell every desktop\n    set picture to "${escaped}"\n  end tell\nend tell`,
    `tell application "Finder"\n  set desktop picture to POSIX file "${escaped}"\nend tell`,
  ];
}

async function runAppleScriptAsUser(script: string, username: string): Promise<void> {
  const isCurrentUser = username === os.userInfo().username;
  let cmd = `osascript -e '${script}'`;
  if (!isCurrentUser) {
    const { stdout } = await execAsync(`id -u ${username}`);
    const userId = stdout.trim();
    cmd = `launchctl asuser ${userId} sudo -u ${username} osascript -e '${script}'`;
  }
  await execAsync(cmd);
}
async function setWallpaperMac(imagePath: string, username: string): Promise<PluginResult> {
  const scripts = buildScripts(imagePath);
  try {
    await runAppleScriptAsUser(scripts[0], username);
    return { success: true, username, message: 'Wallpaper set successfully (System Events)' };
  } catch (e: unknown) {
    logger.warn(`System Events wallpaper failed, retrying with Finder: ${errorMessage(e)}`);
    try {
      await runAppleScriptAsUser(scripts[1], username);
      return { success: true, username, message: 'Wallpaper set successfully (Finder fallback)' };
    } catch (fallbackError: unknown) {
      return { success: false, username, error: errorMessage(fallbackError) };
    }
  }
}

export const handle = async (args: WallpaperArgs): Promise<PluginResult> => {
  try {
    if (args.action === actionSet) return await runSet(args);
    return { success: false, error: `Unknown action: ${args.action}` };
  } catch (e: unknown) {
    logger.error(`Wallpaper plugin error: ${errorMessage(e)}`);
    return { success: false, error: errorMessage(e) };
  }
};
