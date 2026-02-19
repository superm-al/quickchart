import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../src/middleware/error-handler.js';
import { ValidationError, ChartRenderError, AppError } from '../../../src/types/errors.js';

describe('error-handler middleware', () => {
  function createTestApp(error: Error) {
    const app = express();
    app.get('/test', () => {
      throw error;
    });
    app.use(errorHandler);
    return app;
  }

  it('should handle ValidationError with 400', async () => {
    const app = createTestApp(new ValidationError('bad input'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('bad input');
  });

  it('should handle ChartRenderError with 422', async () => {
    const app = createTestApp(new ChartRenderError('render failed'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CHART_RENDER_ERROR');
  });

  it('should handle generic errors with 500', async () => {
    const app = createTestApp(new Error('unexpected'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    // Should not leak internal error message
    expect(res.body.error.message).toBe('An unexpected error occurred');
  });

  it('should handle AppError with custom status', async () => {
    const app = createTestApp(new AppError('custom', 418, 'TEAPOT'));
    const res = await request(app).get('/test');
    expect(res.status).toBe(418);
    expect(res.body.error.code).toBe('TEAPOT');
  });
});
