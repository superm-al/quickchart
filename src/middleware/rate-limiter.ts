import rateLimit from 'express-rate-limit';
import { getConfig } from '../config/index.js';

export function createRateLimiter() {
  const config = getConfig();
  if (!config.RATE_LIMIT_PER_MIN) {
    return undefined;
  }

  return rateLimit({
    windowMs: 60 * 1000,
    max: config.RATE_LIMIT_PER_MIN,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          'Too many requests. Please slow down or visit https://quickchart.io/pricing/ for rate limit exceptions.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    },
  });
}
