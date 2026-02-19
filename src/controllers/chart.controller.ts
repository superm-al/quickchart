import type { Request, Response, NextFunction } from 'express';
import { renderChart } from '../services/chart.service.js';
import type { ChartQuery } from '../schemas/chart.schema.js';
import type { OutputFormat } from '../types/chart.js';
import { CACHE_MAX_AGE } from '../config/constants.js';
import { getConfig } from '../config/index.js';

const FORMAT_CONTENT_TYPE: Record<OutputFormat, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export async function handleChart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = (req.chartParams ?? req.query) as unknown as ChartQuery;
    const config = getConfig();
    const isDev = config.NODE_ENV !== 'production';

    const buf = await renderChart({
      chart: params.chart,
      width: params.width,
      height: params.height,
      format: params.format,
      backgroundColor: params.backgroundColor,
      devicePixelRatio: params.devicePixelRatio,
      encoding: params.encoding,
    });

    const contentType = FORMAT_CONTENT_TYPE[params.format];

    if (params.encoding === 'base64' && params.format !== 'svg') {
      res
        .status(200)
        .set({ 'Cache-Control': isDev ? 'no-cache' : `public, max-age=${CACHE_MAX_AGE}` })
        .type('text/plain')
        .send(buf.toString('base64'));
    } else {
      res
        .status(200)
        .set({
          'Content-Type': contentType,
          'Content-Length': String(buf.length),
          'Cache-Control': isDev ? 'no-cache' : `public, max-age=${CACHE_MAX_AGE}`,
        })
        .end(buf);
    }
  } catch (err) {
    next(err);
  }
}
