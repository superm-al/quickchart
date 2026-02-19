import client from 'prom-client';

export const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'quickchart_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['endpoint', 'status'] as const,
  registers: [register],
});

export const chartsRenderedTotal = new client.Counter({
  name: 'quickchart_charts_rendered_total',
  help: 'Total charts rendered',
  labelNames: ['format'] as const,
  registers: [register],
});

export const qrGeneratedTotal = new client.Counter({
  name: 'quickchart_qr_generated_total',
  help: 'Total QR codes generated',
  registers: [register],
});

export const graphvizRenderedTotal = new client.Counter({
  name: 'quickchart_graphviz_rendered_total',
  help: 'Total Graphviz diagrams rendered',
  registers: [register],
});

export const errorsTotal = new client.Counter({
  name: 'quickchart_errors_total',
  help: 'Total errors',
  registers: [register],
});

export const requestDuration = new client.Histogram({
  name: 'quickchart_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['endpoint'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});
