import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';
import { SIMPLE_BAR_CHART } from '../helpers/chart-fixtures.js';

describe('GET /chart', () => {
  const app = getTestApp();

  it('should render a PNG chart', async () => {
    const res = await request(app).get(`/chart?chart=${encodeURIComponent(SIMPLE_BAR_CHART)}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should render an SVG chart', async () => {
    const res = await request(app).get(
      `/chart?chart=${encodeURIComponent(SIMPLE_BAR_CHART)}&format=svg`,
    );
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/svg+xml');
  });

  it('should render a WebP chart', async () => {
    const res = await request(app).get(
      `/chart?chart=${encodeURIComponent(SIMPLE_BAR_CHART)}&format=webp`,
    );
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
  });

  it('should return 400 when chart is missing', async () => {
    const res = await request(app).get('/chart');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept width and height params', async () => {
    const res = await request(app).get(
      `/chart?chart=${encodeURIComponent(SIMPLE_BAR_CHART)}&width=800&height=600`,
    );
    expect(res.status).toBe(200);
  });

  it('should set cache-control header', async () => {
    const res = await request(app).get(`/chart?chart=${encodeURIComponent(SIMPLE_BAR_CHART)}`);
    expect(res.headers['cache-control']).toBeDefined();
  });
});

describe('POST /chart', () => {
  const app = getTestApp();

  it('should render a chart from POST body', async () => {
    const res = await request(app)
      .post('/chart')
      .send({ chart: SIMPLE_BAR_CHART, format: 'png' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('should handle base64 encoding', async () => {
    const encoded = Buffer.from(SIMPLE_BAR_CHART).toString('base64');
    const res = await request(app)
      .post('/chart')
      .send({ chart: encoded, encoding: 'base64' });
    expect(res.status).toBe(200);
  });
});
