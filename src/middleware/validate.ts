import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../types/errors.js';

type RequestSource = 'query' | 'body' | 'params';

export function validate(schema: ZodSchema, source: RequestSource = 'query') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new ValidationError(message));
      } else {
        next(err);
      }
    }
  };
}

export function validateMerged(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const merged = { ...req.query, ...req.body };
      const parsed = schema.parse(merged);
      req.chartParams = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new ValidationError(message));
      } else {
        next(err);
      }
    }
  };
}

declare global {
  namespace Express {
    interface Request {
      chartParams?: Record<string, unknown>;
    }
  }
}
