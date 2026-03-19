import { createLogger } from './utils/logger';

const logger = createLogger('Agent');

export interface StoppableAgent {
  stop: () => void;
}

export function setupGracefulShutdown(agent: StoppableAgent): void {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    agent.stop();
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    logger.error(error.stack);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(`Unhandled rejection: ${error.message}`);
    if (error.stack) logger.error(error.stack);
  });
}
