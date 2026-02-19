import { Router } from 'express';
import { register } from '../lib/metrics.js';
import { getConfig } from '../config/index.js';

export const metricsRouter = Router();

metricsRouter.get('/', async (_req, res) => {
  const config = getConfig();
  if (config.DISABLE_METRICS) {
    res.status(404).end('Metrics are disabled');
    return;
  }

  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
