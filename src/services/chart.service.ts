import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';
import { ChartRenderError } from '../types/errors.js';
import type { ChartRenderRequest } from '../types/chart.js';
import { parseChartConfig } from './chart-config-parser.js';
import {
  createBackgroundPlugin,
  applySparklineTransform,
  applyProgressBarTransform,
} from './chart-plugins.js';
import { uniqueSvg } from './svg.service.js';
import { getPdfBufferFromPng } from './pdf.service.js';
import { pngToWebp } from './image-converter.service.js';
import { logger } from '../lib/logger.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

function createRenderer(
  width: number,
  height: number,
  format?: string,
): ChartJSNodeCanvas {
  return new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: 'transparent',
    type: format === 'svg' ? 'svg' : undefined,
    plugins: {
      modern: ['chartjs-plugin-datalabels', 'chartjs-plugin-annotation'],
    },
    chartCallback: (ChartJS) => {
      // Register date adapter
      import('chartjs-adapter-date-fns').catch(() => {
        // Optional adapter - ignore if not available
      });

      ChartJS.defaults.responsive = false;
      ChartJS.defaults.maintainAspectRatio = false;
    },
  });
}

function resolveChartConfig(request: ChartRenderRequest): ChartConfiguration {
  let chartInput: string = request.chart;

  if (request.encoding === 'base64') {
    chartInput = Buffer.from(request.chart, 'base64').toString('utf8');
  }

  let chart: any;

  // Try JSON parse first, then fall back to VM-based parsing for JS expressions
  try {
    chart = JSON.parse(chartInput);
  } catch {
    chart = parseChartConfig(chartInput, request.width, request.height);
  }

  // Fix common spelling
  if (chart.type === 'donut') {
    chart.type = 'doughnut';
  }

  const config = chart as ChartConfiguration;

  // Apply custom chart type transforms
  applySparklineTransform(config);
  applyProgressBarTransform(config);

  // Set device pixel ratio
  config.options = config.options || {};
  config.options.devicePixelRatio = request.devicePixelRatio;

  // Defaults for common chart types
  if (['bar', 'line', 'scatter', 'bubble'].includes(config.type as string)) {
    if (!config.options.scales) {
      config.options.scales = {
        y: { beginAtZero: true },
      };
    }
  }

  // Default line tension to 0 (straight lines)
  if (config.type === 'line' && config.data?.datasets) {
    for (const dataset of config.data.datasets) {
      if ((dataset as any).tension === undefined) {
        (dataset as any).tension = 0;
      }
    }
  }

  // Default datalabels config
  config.options.plugins = config.options.plugins || {};
  if (!(config.options.plugins as any).datalabels) {
    const showLabels = config.type === 'pie' || config.type === 'doughnut';
    (config.options.plugins as any).datalabels = {
      display: showLabels,
    };
  }

  return config;
}

export async function renderChart(request: ChartRenderRequest): Promise<Buffer> {
  logger.debug(
    { width: request.width, height: request.height, format: request.format },
    'Rendering chart',
  );

  let config: ChartConfiguration;
  try {
    config = resolveChartConfig(request);
  } catch (err) {
    if (err instanceof ChartRenderError) throw err;
    throw new ChartRenderError(`Failed to parse chart config: ${(err as Error).message}`);
  }

  // Add background plugin
  const bgPlugin = createBackgroundPlugin(request.backgroundColor);
  config.plugins = config.plugins || [];
  config.plugins.push(bgPlugin);

  const renderer = createRenderer(request.width, request.height, request.format);

  try {
    if (request.format === 'svg') {
      const svgBuffer = renderer.renderToBufferSync(config);
      return Buffer.from(uniqueSvg(svgBuffer.toString()));
    }

    const pngBuffer = await renderer.renderToBuffer(config);

    if (request.format === 'pdf') {
      return await getPdfBufferFromPng(pngBuffer);
    }

    if (request.format === 'webp') {
      return await pngToWebp(pngBuffer);
    }

    return pngBuffer;
  } catch (err) {
    logger.error({ err }, 'Chart render error');
    throw new ChartRenderError(`Chart rendering failed: ${(err as Error).message}`);
  }
}
