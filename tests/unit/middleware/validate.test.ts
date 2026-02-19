import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate.js';
import { errorHandler } from '../../../src/middleware/error-handler.js';

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.coerce.number().int().positive(),
  });

  function createTestApp() {
    const app = express();
    app.use(express.json());
    app.get('/test', validate(schema, 'query'), (_req, res) => {
      res.json({ ok: true });
    });
    app.post('/test', validate(schema, 'body'), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);
    return app;
  }

  it('should pass valid query params', async () => {
    const app = createTestApp();
    const res = await request(app).get('/test?name=Alice&age=30');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('should reject invalid query params with 400', async () => {
    const app = createTestApp();
    const res = await request(app).get('/test?name=&age=abc');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should pass valid body params', async () => {
    const app = createTestApp();
    const res = await request(app).post('/test').send({ name: 'Bob', age: 25 });
    expect(res.status).toBe(200);
  });

  it('should reject missing required fields', async () => {
    const app = createTestApp();
    const res = await request(app).get('/test?age=30');
    expect(res.status).toBe(400);
  });
});
