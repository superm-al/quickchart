import corsMiddleware from 'cors';
import { getConfig } from '../config/index.js';

export function createCorsMiddleware() {
  const config = getConfig();
  return corsMiddleware({
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });
}
