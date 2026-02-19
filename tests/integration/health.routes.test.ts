import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('GET /healthcheck', () => {
  const app = getTestApp();

  it('should return success and version', async () => {
    const res = await request(app).get('/healthcheck');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBe('2.0.0');
  });
});

describe('GET /', () => {
  const app = getTestApp();

  it('should return running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('QuickChart is running');
  });
});
