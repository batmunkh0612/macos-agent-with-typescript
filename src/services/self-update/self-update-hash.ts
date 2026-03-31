import { createHash } from 'crypto';

export const sha256Hex = (body: string): string =>
  createHash('sha256').update(body, 'utf8').digest('hex');

export const checksumMatches = (body: string, expected: string): boolean =>
  sha256Hex(body).toLowerCase() === expected.trim().toLowerCase();
