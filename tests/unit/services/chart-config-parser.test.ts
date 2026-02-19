import { describe, it, expect } from 'vitest';
import { parseChartConfig } from '../../../src/services/chart-config-parser.js';

describe('parseChartConfig', () => {
  it('should parse a simple JS object expression', () => {
    const input = `{ type: 'bar', data: { labels: ['A', 'B'], datasets: [{ data: [1, 2] }] } }`;
    const result = parseChartConfig(input, 500, 300);
    expect(result.type).toBe('bar');
  });

  it('should reject input exceeding max length', () => {
    const input = 'x'.repeat(200_000);
    expect(() => parseChartConfig(input, 500, 300)).toThrow('exceeds maximum length');
  });

  it('should reject non-object results', () => {
    expect(() => parseChartConfig('"just a string"', 500, 300)).toThrow('must be an object');
  });

  it('should reject code with eval', () => {
    expect(() =>
      parseChartConfig("eval('process.exit()')", 500, 300),
    ).toThrow();
  });

  it('should timeout on infinite loops', () => {
    expect(() =>
      parseChartConfig('(() => { while(true){} })()', 500, 300),
    ).toThrow();
  });

  it('should provide gradient helpers in sandbox', () => {
    const input = `{
      type: 'bar',
      data: {
        datasets: [{
          backgroundColor: getGradientFillHelper('horizontal', ['#f00', '#00f']),
          data: [1, 2, 3]
        }]
      }
    }`;
    const result = parseChartConfig(input, 500, 300);
    expect(result.type).toBe('bar');
    const datasets = (result.data as Record<string, unknown>).datasets as Array<Record<string, unknown>>;
    expect(typeof datasets[0]!.backgroundColor).toBe('function');
  });
});
