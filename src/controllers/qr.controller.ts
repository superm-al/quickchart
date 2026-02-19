import type { Request, Response, NextFunction } from 'express';
import { renderQr } from '../services/qr.service.js';
import type { QrQuery } from '../schemas/qr.schema.js';
import { CACHE_MAX_AGE } from '../config/constants.js';
import { getConfig } from '../config/index.js';

export async function handleQr(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const params = req.query as unknown as QrQuery;
    const config = getConfig();
    const isDev = config.NODE_ENV !== 'production';

    const buf = await renderQr({
      text: params.text,
      format: params.format,
      size: params.size,
      margin: params.margin,
      ecLevel: params.ecLevel,
      dark: params.dark,
      light: params.light,
      mode: params.mode,
    });

    const contentType = params.format === 'svg' ? 'image/svg+xml' : 'image/png';
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
