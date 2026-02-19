import { describe, it, expect } from 'vitest';
import { renderChart } from '../../../src/services/chart.service.js';
import {
  SIMPLE_BAR_CHART,
  SIMPLE_PIE_CHART,
  JS_EXPRESSION_CHART,
} from '../../helpers/chart-fixtures.js';

describe('chart.service', () => {
  it('should render a PNG bar chart from JSON', async () => {
    const buf = await renderChart({
      chart: SIMPLE_BAR_CHART,
      width: 500,
      height: 300,
      format: 'png',
      backgroundColor: 'transparent',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it('should render an SVG chart', async () => {
    const buf = await renderChart({
      chart: SIMPLE_BAR_CHART,
      width: 500,
      height: 300,
      format: 'svg',
      backgroundColor: 'transparent',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    const svg = buf.toString('utf8');
    expect(svg).toContain('<svg');
  });

  it('should render a pie chart', async () => {
    const buf = await renderChart({
      chart: SIMPLE_PIE_CHART,
      width: 400,
      height: 400,
      format: 'png',
      backgroundColor: 'white',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('should handle JS expression chart configs', async () => {
    const buf = await renderChart({
      chart: JS_EXPRESSION_CHART,
      width: 500,
      height: 300,
      format: 'png',
      backgroundColor: 'transparent',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('should handle base64-encoded chart config', async () => {
    const encoded = Buffer.from(SIMPLE_BAR_CHART).toString('base64');
    const buf = await renderChart({
      chart: encoded,
      width: 500,
      height: 300,
      format: 'png',
      backgroundColor: 'transparent',
      devicePixelRatio: 1,
      encoding: 'base64',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('should render WebP', async () => {
    const buf = await renderChart({
      chart: SIMPLE_BAR_CHART,
      width: 500,
      height: 300,
      format: 'webp',
      backgroundColor: 'transparent',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    expect(buf).toBeInstanceOf(Buffer);
    // WebP magic: RIFF....WEBP
    expect(buf.slice(0, 4).toString()).toBe('RIFF');
  });

  it('should render PDF', async () => {
    const buf = await renderChart({
      chart: SIMPLE_BAR_CHART,
      width: 500,
      height: 300,
      format: 'pdf',
      backgroundColor: 'white',
      devicePixelRatio: 1,
      encoding: 'url',
    });
    expect(buf).toBeInstanceOf(Buffer);
    // PDF magic bytes
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('should throw on invalid chart config', async () => {
    await expect(
      renderChart({
        chart: 'this is not valid',
        width: 500,
        height: 300,
        format: 'png',
        backgroundColor: 'transparent',
        devicePixelRatio: 1,
        encoding: 'url',
      }),
    ).rejects.toThrow();
  });
});
