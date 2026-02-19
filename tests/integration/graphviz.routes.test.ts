import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { getTestApp } from '../helpers/test-app.js';

describe('GET /graphviz', () => {
  const app = getTestApp();

  it('should render SVG by default', async () => {
    const res = await request(app).get('/graphviz?graph=digraph{a->b}');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/svg+xml');
    const body = res.text || res.body.toString();
    expect(body).toContain('<svg');
  });

  it('should render PNG when requested', async () => {
    const res = await request(app).get('/graphviz?graph=digraph{a->b}&format=png');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('should return 400 when graph is missing', async () => {
    const res = await request(app).get('/graphviz');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 422 on invalid graph syntax', async () => {
    const res = await request(app).get('/graphviz?graph=this_is_not_valid_dot');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('GRAPHVIZ_RENDER_ERROR');
  });

  it('should accept engine parameter', async () => {
    const res = await request(app).get('/graphviz?graph=digraph{a->b}&engine=neato');
    expect(res.status).toBe(200);
  });
});

describe('POST /graphviz', () => {
  const app = getTestApp();

  it('should render from POST body', async () => {
    const res = await request(app)
      .post('/graphviz')
      .send({ graph: 'digraph { a -> b }', format: 'svg' });
    expect(res.status).toBe(200);
    const body = res.text || res.body.toString();
    expect(body).toContain('<svg');
  });
});
