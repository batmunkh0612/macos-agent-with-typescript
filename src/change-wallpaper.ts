import * as path from 'path';
import { handle } from './plugins/wallpaper';
import { createLogger } from './utils/logger';

const logger = createLogger('ChangeWallpaperScript');

interface CliOptions {
  imagePath: string;
  username?: string;
}

interface RawCliOptions {
  imagePath?: string;
  username?: string;
}

interface WallpaperResult {
  success: boolean;
  error?: string;
  message?: string;
}

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function readOptionValue(argv: string[], index: number): string | undefined {
  return argv[index + 1];
}

function isImageFlag(flag: string): boolean {
  return flag === '--image' || flag === '-i';
}

function isUserFlag(flag: string): boolean {
  return flag === '--user' || flag === '-u';
}

function applyOption(result: RawCliOptions, flag: string, value: string | undefined): void {
  if (isImageFlag(flag)) {
    result.imagePath = value;
    return;
  }
  if (isUserFlag(flag)) {
    result.username = value;
  }
}

function collectRawOptions(argv: string[]): RawCliOptions {
  const result: RawCliOptions = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = readOptionValue(argv, i);
    applyOption(result, arg, value);
    if (value) i += 1;
  }
  return result;
}

function normalizeOptions(raw: RawCliOptions): CliOptions {
  const imagePath = raw.imagePath;

  if (!imagePath) {
    throw new Error('Usage: change-wallpaper --image <path> [--user <username>]');
  }

  const resolved = path.resolve(imagePath);
  return { imagePath: resolved, username: raw.username };
}

function parseCliArgs(argv: string[]): CliOptions {
  const raw = collectRawOptions(argv);
  return normalizeOptions(raw);
}

async function callWallpaperPlugin(options: CliOptions): Promise<WallpaperResult> {
  return handle({
    action: 'set',
    // eslint-disable-next-line camelcase
    image_path: options.imagePath,
    username: options.username,
  });
}

async function runChangeWallpaper(options: CliOptions): Promise<void> {
  const userSuffix = options.username ? ` for user ${options.username}` : '';
  logger.info(`Changing wallpaper to: ${options.imagePath}${userSuffix}`);

  const result = await callWallpaperPlugin(options);

  logResult(result);
}

function isSuccess(result: WallpaperResult): boolean {
  return result.success;
}

function successMessage(result: WallpaperResult): string {
  return result.message ?? 'Wallpaper set successfully';
}

function errorMessageFromResult(result: WallpaperResult): string {
  return result.error ?? 'Unknown error';
}

function logResult(result: WallpaperResult): void {
  if (isSuccess(result)) {
    logger.info(successMessage(result));
    return;
  }

  const message = errorMessageFromResult(result);
  logger.error(`Failed to set wallpaper: ${message}`);
  process.exitCode = 1;
}

async function main(): Promise<void> {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    await runChangeWallpaper(args);
  } catch (e: unknown) {
    logger.error(`change-wallpaper script error: ${toErrorMessage(e)}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}

