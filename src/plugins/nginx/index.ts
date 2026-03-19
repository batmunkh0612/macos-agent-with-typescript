import { createLogger } from '../../utils/logger';
import { runRestart } from './restart';
import { runStatus } from './status';
import { runReload } from './reload';
import { runTest } from './test';
import { defaultService } from './utils';
import type { NginxArgs, NginxResult } from './types';

const logger = createLogger('Plugin.Nginx');

const actionRestart = 'restart';
const actionStatus = 'status';
const actionReload = 'reload';
const actionTest = 'test';

type ActionHandler = (_args: NginxArgs) => Promise<NginxResult>;

function getService(args: NginxArgs): string {
  return args.service ?? defaultService;
}

const handlers: Record<NginxArgs['action'], ActionHandler> = {
  [actionRestart]: (a) => runRestart(getService(a)),
  [actionStatus]: (a) => runStatus(getService(a)),
  [actionReload]: (a) => runReload(getService(a)),
  [actionTest]: () => runTest(),
};

async function dispatch(args: NginxArgs): Promise<NginxResult> {
  const handler = handlers[args.action];
  return handler(args);
}

export const handle = async (args: NginxArgs): Promise<NginxResult> => {
  logger.info(`Nginx action: ${args.action}`);
  try {
    return await dispatch(args);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
};

export { runRestart, runStatus, runReload, runTest };
export type { NginxArgs, NginxResult, NginxAction } from './types';
