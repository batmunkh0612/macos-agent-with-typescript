import * as path from 'path';

export const getAgentMainPath = (): string => {
  const argvPath = process.argv[1];
  if (!argvPath) throw new Error('Cannot resolve agent script path (process.argv[1] empty)');
  return path.resolve(argvPath);
};
