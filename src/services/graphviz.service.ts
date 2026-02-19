import { instance } from '@viz-js/viz';
import sharp from 'sharp';
import { GraphvizRenderError } from '../types/errors.js';
import type { GraphvizRenderRequest } from '../types/graphviz.js';
import { logger } from '../lib/logger.js';

let vizInstance: Awaited<ReturnType<typeof instance>> | undefined;

async function getViz() {
  if (!vizInstance) {
    vizInstance = await instance();
  }
  return vizInstance;
}

export async function renderGraphviz(request: GraphvizRenderRequest): Promise<Buffer> {
  logger.debug({ engine: request.engine, format: request.format }, 'Rendering Graphviz');

  try {
    const viz = await getViz();
    const svgResult = viz.renderString(request.graph, {
      format: 'svg',
      engine: request.engine,
    });

    if (request.format === 'png') {
      const img = sharp(Buffer.from(svgResult));
      if (request.width && request.height) {
        img.resize({
          width: request.width,
          height: request.height,
          fit: 'contain',
        });
      }
      return await img.png().toBuffer();
    }

    return Buffer.from(svgResult, 'utf8');
  } catch (err) {
    logger.error({ err }, 'Graphviz render error');
    throw new GraphvizRenderError(`Graphviz rendering failed: ${err}`);
  }
}
