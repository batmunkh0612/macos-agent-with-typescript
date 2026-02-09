import axios from 'axios';
import { createLogger } from './logger';

const logger = createLogger('NetworkUtils');

/**
 * Wait for network connectivity before starting.
 * Returns true when probe succeeds, false on timeout.
 */
export async function waitForNetwork(
  timeout: number = 120,
  checkInterval: number = 5,
  checkUrl: string = 'https://www.google.com'
): Promise<boolean> {
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;

  while (Date.now() - startTime < timeoutMs) {
    try {
      await axios.get(checkUrl, { timeout: 3000 });
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      logger.info(`Network available after ${elapsed}s`);
      return true;
    } catch (error) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      logger.info(`Waiting for network... ${elapsed}s`);
      await new Promise((resolve) => setTimeout(resolve, checkInterval * 1000));
    }
  }

  logger.error('Network not available after timeout');
  return false;
}
