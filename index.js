const path = require('path');

const express = require('express');
const javascriptStringify = require('javascript-stringify').stringify;
const qs = require('qs');
const rateLimit = require('express-rate-limit');
const text2png = require('text2png');

const packageJson = require('./package.json');
const { getPdfBufferFromPng, getPdfBufferWithText } = require('./lib/pdf');
const { logger } = require('./logging');
const { renderChartJs, renderChartJsToWebp } = require('./lib/charts');
const { renderGraphviz } = require('./lib/graphviz');
const { toChartJs, parseSize } = require('./lib/google_image_charts');
const { renderQr, DEFAULT_QR_SIZE } = require('./lib/qr');

const app = express();

const isDev = app.get('env') === 'development' || app.get('env') === 'test';

app.set('query parser', (str) =>
  qs.parse(str, {
    decode(s) {
      // Default express implementation replaces '+' with space. We don't want
      // that. See https://github.com/expressjs/express/issues/3453
      return decodeURIComponent(s);
    },
  }),
);

app.use(
  express.json({
    limit: process.env.EXPRESS_JSON_LIMIT || '100kb',
  }),
);

app.use(express.urlencoded({ extended: false }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

// CORS support
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin !== '') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', corsOrigin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });
}

// Prometheus metrics
const metrics = {
  requestsTotal: {},
  chartsRenderedTotal: {},
  qrGeneratedTotal: 0,
  errorsTotal: 0,
  requestDuration: {},
};
const HISTOGRAM_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

function incCounter(counter, labels) {
  const key = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
  counter[key] = (counter[key] || 0) + 1;
}

function observeDuration(endpoint, durationSec) {
  if (!metrics.requestDuration[endpoint]) {
    metrics.requestDuration[endpoint] = { sum: 0, count: 0, buckets: {} };
    HISTOGRAM_BUCKETS.forEach(b => { metrics.requestDuration[endpoint].buckets[b] = 0; });
  }
  const entry = metrics.requestDuration[endpoint];
  entry.sum += durationSec;
  entry.count += 1;
  HISTOGRAM_BUCKETS.forEach(b => {
    if (durationSec <= b) {
      entry.buckets[b] += 1;
    }
  });
}

function formatMetrics() {
  const lines = [];

  lines.push('# HELP quickchart_requests_total Total number of requests');
  lines.push('# TYPE quickchart_requests_total counter');
  for (const [labels, count] of Object.entries(metrics.requestsTotal)) {
    lines.push(`quickchart_requests_total{${labels}} ${count}`);
  }

  lines.push('# HELP quickchart_charts_rendered_total Total charts rendered');
  lines.push('# TYPE quickchart_charts_rendered_total counter');
  for (const [labels, count] of Object.entries(metrics.chartsRenderedTotal)) {
    lines.push(`quickchart_charts_rendered_total{${labels}} ${count}`);
  }

  lines.push('# HELP quickchart_qr_generated_total Total QR codes generated');
  lines.push('# TYPE quickchart_qr_generated_total counter');
  lines.push(`quickchart_qr_generated_total ${metrics.qrGeneratedTotal}`);

  lines.push('# HELP quickchart_errors_total Total errors');
  lines.push('# TYPE quickchart_errors_total counter');
  lines.push(`quickchart_errors_total ${metrics.errorsTotal}`);

  lines.push('# HELP quickchart_request_duration_seconds Request duration histogram');
  lines.push('# TYPE quickchart_request_duration_seconds histogram');
  for (const [endpoint, data] of Object.entries(metrics.requestDuration)) {
    let cumulative = 0;
    HISTOGRAM_BUCKETS.forEach(b => {
      cumulative += data.buckets[b];
      lines.push(`quickchart_request_duration_seconds_bucket{endpoint="${endpoint}",le="${b}"} ${cumulative}`);
    });
    lines.push(`quickchart_request_duration_seconds_bucket{endpoint="${endpoint}",le="+Inf"} ${data.count}`);
    lines.push(`quickchart_request_duration_seconds_sum{endpoint="${endpoint}"} ${data.sum}`);
    lines.push(`quickchart_request_duration_seconds_count{endpoint="${endpoint}"} ${data.count}`);
  }

  return lines.join('\n') + '\n';
}

// Metrics and request logging middleware
const skipLoggingPaths = new Set(['/healthcheck']);
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [sec, ns] = process.hrtime(start);
    const durationSec = sec + ns / 1e9;
    const durationMs = (durationSec * 1000).toFixed(1);
    const endpoint = req.route ? req.route.path : req.path;

    // Metrics tracking
    if (!process.env.DISABLE_METRICS) {
      incCounter(metrics.requestsTotal, { endpoint, status: res.statusCode });
      observeDuration(endpoint, durationSec);
      if (res.statusCode >= 400) {
        metrics.errorsTotal += 1;
      }
    }

    // Request logging
    if (!skipLoggingPaths.has(req.path)) {
      const logData = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
      };
      if (res.statusCode >= 500) {
        logger.error(logData, 'request completed');
      } else if (res.statusCode >= 400) {
        logger.warn(logData, 'request completed');
      } else {
        logger.info(logData, 'request completed');
      }
    }
  });
  next();
});

if (process.env.RATE_LIMIT_PER_MIN) {
  const limitMax = parseInt(process.env.RATE_LIMIT_PER_MIN, 10);
  logger.info('Enabling rate limit:', limitMax);

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: limitMax,
    message:
      'Please slow down your requests! This is a shared public endpoint. Email support@quickchart.io or go to https://quickchart.io/pricing/ for rate limit exceptions or to purchase a commercial license.',
    onLimitReached: (req) => {
      logger.info('User hit rate limit!', req.ip);
    },
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for'] || req.ip;
    },
  });
  app.use('/chart', limiter);
}

app.get('/', (req, res) => {
  res.send(
    'QuickChart is running!<br><br>If you are using QuickChart commercially, please consider <a href="https://quickchart.io/pricing/">purchasing a license</a> to support the project.',
  );
});

function utf8ToAscii(str) {
  const enc = new TextEncoder();
  const u8s = enc.encode(str);

  return Array.from(u8s)
    .map((v) => String.fromCharCode(v))
    .join('');
}

function escapeXml(str) {
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeErrorHeader(msg) {
  if (typeof msg === 'string') {
    return utf8ToAscii(msg).replace(/\r?\n|\r/g, '');
  }
  return '';
}

function failPng(res, msg, statusCode = 500) {
  res.writeHead(statusCode, {
    'Content-Type': 'image/png',
    'X-quickchart-error': sanitizeErrorHeader(msg),
  });
  res.end(
    text2png(`Chart Error: ${msg}`, {
      padding: 10,
      backgroundColor: '#fff',
    }),
  );
}

function failSvg(res, msg, statusCode = 500) {
  res.writeHead(statusCode, {
    'Content-Type': 'image/svg+xml',
    'X-quickchart-error': sanitizeErrorHeader(msg),
  });
  res.end(`
<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <style>
    p {
      font-size: 8px;
    }
  </style>
  <foreignObject width="240" height="80"
   requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
    <p xmlns="http://www.w3.org/1999/xhtml">${escapeXml(msg)}</p>
  </foreignObject>
</svg>`);
}

async function failPdf(res, msg) {
  const buf = await getPdfBufferWithText(msg);
  res.writeHead(500, {
    'Content-Type': 'application/pdf',
    'X-quickchart-error': sanitizeErrorHeader(msg),
  });
  res.end(buf);
}

function renderChartToPng(req, res, opts) {
  opts.failFn = failPng;
  opts.onRenderHandler = (buf) => {
    res
      .type('image/png')
      .set({
        // 1 week cache
        'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
      })
      .send(buf)
      .end();
  };
  doChartjsRender(req, res, opts);
}

function renderChartToSvg(req, res, opts) {
  opts.failFn = failSvg;
  opts.onRenderHandler = (buf) => {
    res
      .type('image/svg+xml')
      .set({
        // 1 week cache
        'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
      })
      .send(buf)
      .end();
  };
  doChartjsRender(req, res, opts);
}

async function renderChartToPdf(req, res, opts) {
  opts.failFn = failPdf;
  opts.onRenderHandler = async (buf) => {
    const pdfBuf = await getPdfBufferFromPng(buf);

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuf.length,

      // 1 week cache
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
    });
    res.end(pdfBuf);
  };
  doChartjsRender(req, res, opts);
}

function renderChartToWebp(req, res, opts) {
  opts.failFn = failPng;
  opts.onRenderHandler = (buf) => {
    res
      .type('image/webp')
      .set({
        'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
      })
      .send(buf)
      .end();
  };
  doChartjsRenderWebp(req, res, opts);
}

function doChartjsRenderWebp(req, res, opts) {
  if (!opts.chart) {
    opts.failFn(res, 'You are missing variable `c` or `chart`');
    return;
  }

  const width = parseInt(opts.width, 10) || 500;
  const height = parseInt(opts.height, 10) || 300;

  let untrustedInput = opts.chart;
  if (opts.encoding === 'base64') {
    try {
      untrustedInput = Buffer.from(opts.chart, 'base64').toString('utf8');
    } catch (err) {
      logger.warn('base64 malformed', err);
      opts.failFn(res, err);
      return;
    }
  }

  renderChartJsToWebp(
    width,
    height,
    opts.backgroundColor,
    opts.devicePixelRatio,
    opts.version || '2.9.4',
    opts.format,
    untrustedInput,
  )
    .then(opts.onRenderHandler)
    .catch((err) => {
      logger.warn('Chart error', err);
      opts.failFn(res, err);
    });
}

function doChartjsRender(req, res, opts) {
  if (!opts.chart) {
    opts.failFn(res, 'You are missing variable `c` or `chart`');
    return;
  }

  const width = parseInt(opts.width, 10) || 500;
  const height = parseInt(opts.height, 10) || 300;

  let untrustedInput = opts.chart;
  if (opts.encoding === 'base64') {
    // TODO(ian): Move this decoding up the call stack.
    try {
      untrustedInput = Buffer.from(opts.chart, 'base64').toString('utf8');
    } catch (err) {
      logger.warn('base64 malformed', err);
      opts.failFn(res, err);
      return;
    }
  }

  renderChartJs(
    width,
    height,
    opts.backgroundColor,
    opts.devicePixelRatio,
    opts.version || '2.9.4',
    opts.format,
    untrustedInput,
  )
    .then(opts.onRenderHandler)
    .catch((err) => {
      logger.warn('Chart error', err);
      opts.failFn(res, err);
    });
}

async function handleGraphviz(req, res, graphVizDef, opts) {
  try {
    const buf = await renderGraphviz(req.query.chl, opts);
    res
      .status(200)
      .type(opts.format === 'png' ? 'image/png' : 'image/svg+xml')
      .end(buf);
  } catch (err) {
    if (opts.format === 'png') {
      failPng(res, `Graph Error: ${err}`);
    } else {
      failSvg(res, `Graph Error: ${err}`);
    }
  }
}

const VALID_GRAPHVIZ_ENGINES = new Set([
  'dot', 'neato', 'twopi', 'circo', 'fdp', 'osage', 'patchwork', 'sfdp',
]);

function handleGChart(req, res) {
  // TODO(ian): Move these special cases into Google Image Charts-specific
  // handler.
  if (req.query.cht.startsWith('gv')) {
    // Graphviz chart
    const format = req.query.chof;
    const engine = req.query.cht.indexOf(':') > -1 ? req.query.cht.split(':')[1] : 'dot';
    if (!VALID_GRAPHVIZ_ENGINES.has(engine)) {
      res.status(400).end(`Invalid Graphviz engine: ${engine}`);
      return;
    }
    const opts = {
      format,
      engine,
    };
    if (req.query.chs) {
      const size = parseSize(req.query.chs);
      opts.width = size.width;
      opts.height = size.height;
    }
    handleGraphviz(req, res, req.query.chl, opts);
    return;
  } else if (req.query.cht === 'qr') {
    const size = parseInt(req.query.chs.split('x')[0], 10);
    const qrData = req.query.chl;
    const chldVals = (req.query.chld || '').split('|');
    const ecLevel = chldVals[0] || 'L';
    const margin = chldVals[1] || 4;
    const qrOpts = {
      margin: margin,
      width: size,
      errorCorrectionLevel: ecLevel,
    };

    const format = 'png';
    const encoding = 'UTF-8';
    renderQr(format, encoding, qrData, qrOpts)
      .then((buf) => {
        res.writeHead(200, {
          'Content-Type': format === 'png' ? 'image/png' : 'image/svg+xml',
          'Content-Length': buf.length,

          // 1 week cache
          'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
        });
        res.end(buf);
      })
      .catch((err) => {
        failPng(res, err);
      });

    return;
  }

  let converted;
  try {
    converted = toChartJs(req.query);
  } catch (err) {
    logger.error(`GChart error: Could not interpret ${req.originalUrl}`);
    res.status(500).end('Sorry, this chart configuration is not supported right now');
    return;
  }

  if (req.query.format === 'chartjs-config') {
    // Chart.js config
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(javascriptStringify(converted.chart, undefined, 2));
    return;
  }

  renderChartJs(
    converted.width,
    converted.height,
    converted.backgroundColor,
    1.0 /* devicePixelRatio */,
    '2.9.4' /* version */,
    undefined /* format */,
    converted.chart,
  ).then((buf) => {
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buf.length,

      // 1 week cache
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
    });
    res.end(buf);
  });
}

app.get('/chart', (req, res) => {
  if (req.query.cht) {
    // This is a Google Image Charts-compatible request.
    handleGChart(req, res);
    return;
  }

  const outputFormat = (req.query.f || req.query.format || 'png').toLowerCase();
  const opts = {
    chart: req.query.c || req.query.chart,
    height: req.query.h || req.query.height,
    width: req.query.w || req.query.width,
    backgroundColor: req.query.backgroundColor || req.query.bkg,
    devicePixelRatio: req.query.devicePixelRatio,
    version: req.query.v || req.query.version,
    encoding: req.query.encoding || 'url',
    format: outputFormat,
  };

  if (outputFormat === 'pdf') {
    renderChartToPdf(req, res, opts);
  } else if (outputFormat === 'svg') {
    renderChartToSvg(req, res, opts);
  } else if (outputFormat === 'webp') {
    renderChartToWebp(req, res, opts);
  } else if (!outputFormat || outputFormat === 'png') {
    renderChartToPng(req, res, opts);
  } else {
    logger.error(`Request for unsupported format ${outputFormat}`);
    res.status(500).end(`Unsupported format ${outputFormat}`);
  }

  // Track chart render metrics
  if (!process.env.DISABLE_METRICS) {
    incCounter(metrics.chartsRenderedTotal, {
      format: outputFormat || 'png',
      version: opts.version || '2.9.4',
    });
  }
});

app.post('/chart', (req, res) => {
  const outputFormat = (req.body.f || req.body.format || 'png').toLowerCase();
  const opts = {
    chart: req.body.c || req.body.chart,
    height: req.body.h || req.body.height,
    width: req.body.w || req.body.width,
    backgroundColor: req.body.backgroundColor || req.body.bkg,
    devicePixelRatio: req.body.devicePixelRatio,
    version: req.body.v || req.body.version,
    encoding: req.body.encoding || 'url',
    format: outputFormat,
  };

  if (outputFormat === 'pdf') {
    renderChartToPdf(req, res, opts);
  } else if (outputFormat === 'svg') {
    renderChartToSvg(req, res, opts);
  } else if (outputFormat === 'webp') {
    renderChartToWebp(req, res, opts);
  } else {
    renderChartToPng(req, res, opts);
  }

  // Track chart render metrics
  if (!process.env.DISABLE_METRICS) {
    incCounter(metrics.chartsRenderedTotal, {
      format: outputFormat || 'png',
      version: opts.version || '2.9.4',
    });
  }
});

app.get('/qr', (req, res) => {
  const qrText = req.query.text;
  if (!qrText) {
    failPng(res, 'You are missing variable `text`');
    return;
  }

  let format = 'png';
  if (req.query.format === 'svg') {
    format = 'svg';
  }

  const { mode } = req.query;

  const margin = typeof req.query.margin === 'undefined' ? 4 : parseInt(req.query.margin, 10);
  const ecLevel = req.query.ecLevel || undefined;
  const size = Math.min(3000, parseInt(req.query.size, 10)) || DEFAULT_QR_SIZE;
  const darkColor = req.query.dark || '000';
  const lightColor = req.query.light || 'fff';

  const qrOpts = {
    margin,
    width: size,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  };

  renderQr(format, mode, qrText, qrOpts)
    .then((buf) => {
      if (!process.env.DISABLE_METRICS) {
        metrics.qrGeneratedTotal += 1;
      }
      res.writeHead(200, {
        'Content-Type': format === 'png' ? 'image/png' : 'image/svg+xml',
        'Content-Length': buf.length,

        // 1 week cache
        'Cache-Control': isDev ? 'no-cache' : 'public, max-age=604800',
      });
      res.end(buf);
    })
    .catch((err) => {
      failPng(res, err);
    });
});

app.get('/gchart', handleGChart);

app.get('/metrics', (req, res) => {
  if (process.env.DISABLE_METRICS) {
    res.status(404).end('Metrics are disabled');
    return;
  }
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.end(formatMetrics());
});

app.get('/healthcheck', (req, res) => {
  // A lightweight healthcheck endpoint.
  res.send({ success: true, version: packageJson.version });
});

app.get('/healthcheck/chart', (req, res) => {
  // A heavier healthcheck endpoint that redirects to a unique chart.
  const labels = [...Array(5)].map(() => Math.random());
  const data = [...Array(5)].map(() => Math.random());
  const template = `
{
  type: 'bar',
  data: {
    labels: [${labels.join(',')}],
    datasets: [{
      data: [${data.join(',')}]
    }]
  }
}
`;
  res.redirect(`/chart?c=${template}`);
});

const port = process.env.PORT || 3400;
const server = app.listen(port);

const timeout = parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 5000;
server.setTimeout(timeout);
logger.info(`Setting request timeout: ${timeout} ms`);

logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`Listening on port ${port}`);

if (!isDev) {
  const gracefulShutdown = function gracefulShutdown() {
    logger.info('Received kill signal, shutting down gracefully.');
    server.close(() => {
      logger.info('Closed out remaining connections.');
      process.exit();
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit();
    }, 10 * 1000);
  };

  // listen for TERM signal .e.g. kill
  process.on('SIGTERM', gracefulShutdown);

  // listen for INT signal e.g. Ctrl-C
  process.on('SIGINT', gracefulShutdown);

  process.on('SIGABRT', () => {
    logger.info('Caught SIGABRT');
  });
}

module.exports = app;
