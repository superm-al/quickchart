import type { Request, Response, NextFunction } from 'express';
import { renderGraphviz } from '../services/graphviz.service.js';
import type { GraphvizQuery } from '../schemas/graphviz.schema.js';
import { CACHE_MAX_AGE } from '../config/constants.js';
import { getConfig } from '../config/index.js';

export async function handleGraphviz(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = (req.chartParams ?? req.query) as unknown as GraphvizQuery;
    const config = getConfig();
    const isDev = config.NODE_ENV !== 'production';

    const buf = await renderGraphviz({
      graph: params.graph,
      format: params.format,
      engine: params.engine,
      width: params.width,
      height: params.height,
    });

    const contentType = params.format === 'png' ? 'image/png' : 'image/svg+xml';
    res
      .status(200)
      .set({
        'Content-Type': contentType,
        'Content-Length': String(buf.length),
        'Cache-Control': isDev ? 'no-cache' : `public, max-age=${CACHE_MAX_AGE}`,
      })
      .end(buf);
  } catch (err) {
    next(err);
  }
}
