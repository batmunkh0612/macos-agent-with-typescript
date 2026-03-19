import { AgentConfig } from './config';
import { Agent } from './agent-class';
import { waitForNetwork } from './utils/network';
import { createLogger } from './utils/logger';

const logger = createLogger('Agent');

async function main(): Promise<void> {
  const config = new AgentConfig();

  if (config.get('network').wait_at_startup) {
    const networkConfig = config.get('network');
    const networkReady = await waitForNetwork(
      networkConfig.timeout,
      networkConfig.check_interval,
      networkConfig.check_url
    );
    if (!networkReady) {
      logger.error('Exiting: network not available');
      process.exit(1);
    }
  }

  const agent = new Agent();
  await agent.start();

  process.stdin.resume();
}

if (require.main === module) {
  main().catch((e: unknown) => {
    const error = e instanceof Error ? e : new Error(String(e));
    logger.error(`Fatal error: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    process.exit(1);
  });
}

export { Agent };
