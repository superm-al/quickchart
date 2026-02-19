import type { Express } from 'express';
import { chartRouter } from './chart.routes.js';
import { qrRouter } from './qr.routes.js';
import { graphvizRouter } from './graphviz.routes.js';
import { healthRouter } from './health.routes.js';
import { metricsRouter } from './metrics.routes.js';

export function registerRoutes(app: Express): void {
  app.get('/', (_req, res) => {
    res.send('QuickChart is running!');
  });

  app.use('/chart', chartRouter);
  app.use('/qr', qrRouter);
  app.use('/graphviz', graphvizRouter);
  app.use('/healthcheck', healthRouter);
  app.use('/metrics', metricsRouter);
}
