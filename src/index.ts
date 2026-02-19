import { createApp } from './app.js';
import { getConfig } from './config/index.js';
import { logger } from './lib/logger.js';
import { setupGracefulShutdown } from './lib/shutdown.js';

const config = getConfig();
const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(`QuickChart listening on port ${config.PORT}`);
  logger.info(`NODE_ENV: ${config.NODE_ENV}`);
});

server.setTimeout(config.REQUEST_TIMEOUT_MS);
logger.info(`Request timeout: ${config.REQUEST_TIMEOUT_MS}ms`);

if (config.NODE_ENV !== 'development') {
  setupGracefulShutdown(server);
}
