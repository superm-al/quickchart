import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('GET /qr', () => {
  const app = getTestApp();

  it('should generate a PNG QR code', async () => {
    const res = await request(app).get('/qr?text=hello');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should generate an SVG QR code', async () => {
    const res = await request(app).get('/qr?text=hello&format=svg');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/svg+xml');
    const body = res.text || res.body.toString();
    expect(body).toContain('<svg');
  });

  it('should return 400 when text is missing', async () => {
    const res = await request(app).get('/qr');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should accept size parameter', async () => {
    const res = await request(app).get('/qr?text=hello&size=300');
    expect(res.status).toBe(200);
  });

  it('should accept custom colors', async () => {
    const res = await request(app).get('/qr?text=hello&dark=ff0000&light=00ff00');
    expect(res.status).toBe(200);
  });
});
