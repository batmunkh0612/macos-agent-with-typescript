import { spawn } from 'child_process';
import * as fs from 'fs';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SelfUpdate');

const DAEMON_PLIST = '/Library/LaunchDaemons/com.remote-agent-ts.plist';

const userPlistPath = (): string => `${process.env.HOME ?? ''}/Library/LaunchAgents/com.remote-agent-ts.plist`;

const resolvePlist = (): string | null => {
  if (fs.existsSync(DAEMON_PLIST)) return DAEMON_PLIST;
  const userPath = userPlistPath();
  if (fs.existsSync(userPath)) return userPath;
  return null;
};

const reloadLaunchd = (plist: string): void => {
  spawn('launchctl', ['unload', plist], { stdio: 'ignore' }).on('close', () => {
    setTimeout(() => {
      spawn('launchctl', ['load', plist], { stdio: 'ignore' }).unref();
    }, 800);
  });
};

export const scheduleAgentRestart = (delayMs: number): void => {
  setTimeout(() => {
    if (process.platform !== 'darwin') {
      logger.warn('Automatic restart is only wired for macOS launchd (com.remote-agent-ts).');
      return;
    }
    const plist = resolvePlist();
    if (!plist) {
      logger.warn('No com.remote-agent-ts plist found; exit and rely on KeepAlive if configured.');
      return;
    }
    reloadLaunchd(plist);
  }, delayMs);
};
