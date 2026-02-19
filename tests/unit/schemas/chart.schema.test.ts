import { describe, it, expect } from 'vitest';
import { chartSchema } from '../../../src/schemas/chart.schema.js';

describe('chartSchema', () => {
  it('should validate minimal valid input', () => {
    const result = chartSchema.parse({ chart: '{}' });
    expect(result.chart).toBe('{}');
    expect(result.width).toBe(500);
    expect(result.height).toBe(300);
    expect(result.format).toBe('png');
    expect(result.encoding).toBe('url');
  });

  it('should reject missing chart', () => {
    expect(() => chartSchema.parse({})).toThrow();
  });

  it('should reject empty chart string', () => {
    expect(() => chartSchema.parse({ chart: '' })).toThrow();
  });

  it('should accept all valid formats', () => {
    for (const format of ['png', 'svg', 'webp', 'pdf']) {
      const result = chartSchema.parse({ chart: '{}', format });
      expect(result.format).toBe(format);
    }
  });

  it('should reject invalid format', () => {
    expect(() => chartSchema.parse({ chart: '{}', format: 'gif' })).toThrow();
  });

  it('should coerce string dimensions to numbers', () => {
    const result = chartSchema.parse({ chart: '{}', width: '800', height: '600' });
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('should reject width exceeding max', () => {
    expect(() => chartSchema.parse({ chart: '{}', width: 5000 })).toThrow();
  });

  it('should reject devicePixelRatio out of range', () => {
    expect(() => chartSchema.parse({ chart: '{}', devicePixelRatio: 5 })).toThrow();
    expect(() => chartSchema.parse({ chart: '{}', devicePixelRatio: 0.1 })).toThrow();
  });
});
