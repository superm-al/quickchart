import pino from 'pino';
import { getConfig } from '../config/index.js';

let _logger: pino.Logger | undefined;

export function getLogger(): pino.Logger {
  if (!_logger) {
    const config = getConfig();
    _logger = pino({
      name: 'quickchart',
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    });
  }
  return _logger;
}

export const logger = new Proxy({} as pino.Logger, {
  get(_target, prop: string | symbol) {
    const l = getLogger() as unknown as Record<string | symbol, unknown>;
    return l[prop];
  },
});
