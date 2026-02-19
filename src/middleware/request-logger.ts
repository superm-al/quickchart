import pinoHttp from 'pino-http';
import type { IncomingMessage } from 'node:http';
import { getLogger } from '../lib/logger.js';

export function createRequestLogger() {
  return (pinoHttp as unknown as typeof pinoHttp.default)({
    logger: getLogger(),
    autoLogging: {
      ignore(req: IncomingMessage) {
        return req.url === '/healthcheck';
      },
    },
  });
}
