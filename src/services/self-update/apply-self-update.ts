import * as fs from 'fs';
import { checksumMatches } from './self-update-hash';

export const writeAgentBundle = (targetPath: string, body: string, checksum: string): void => {
  if (!checksumMatches(body, checksum)) throw new Error('Checksum mismatch');
  const prev = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  fs.writeFileSync(`${targetPath}.backup`, prev, 'utf8');
  fs.writeFileSync(targetPath, body, 'utf8');
};
