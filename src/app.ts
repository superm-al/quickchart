import express from 'express';
import qs from 'qs';
import { getConfig } from './config/index.js';
import { securityHeaders } from './middleware/security-headers.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { createRequestLogger } from './middleware/request-logger.js';
import { createRateLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();
  const config = getConfig();

  // Query parser that doesn't convert + to space
  app.set('query parser', (str: string) =>
    qs.parse(str, {
      decoder(s: string) {
        return decodeURIComponent(s);
      },
    }),
  );

  // Body parsers
  app.use(express.json({ limit: config.EXPRESS_JSON_LIMIT }));
  app.use(express.urlencoded({ extended: false }));

  // Middleware
  app.use(securityHeaders);
  app.use(createCorsMiddleware());

  if (config.NODE_ENV !== 'test') {
    app.use(createRequestLogger());
  }

  const rateLimiter = createRateLimiter();
  if (rateLimiter) {
    app.use('/chart', rateLimiter);
  }

  // Routes
  registerRoutes(app);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
