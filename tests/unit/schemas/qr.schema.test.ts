import { describe, it, expect } from 'vitest';
import { qrQuerySchema } from '../../../src/schemas/qr.schema.js';

describe('qrQuerySchema', () => {
  it('should validate minimal valid input', () => {
    const result = qrQuerySchema.parse({ text: 'hello' });
    expect(result.text).toBe('hello');
    expect(result.format).toBe('png');
    expect(result.size).toBe(150);
    expect(result.margin).toBe(4);
  });

  it('should reject missing text', () => {
    expect(() => qrQuerySchema.parse({})).toThrow();
  });

  it('should reject empty text', () => {
    expect(() => qrQuerySchema.parse({ text: '' })).toThrow();
  });

  it('should accept svg format', () => {
    const result = qrQuerySchema.parse({ text: 'test', format: 'svg' });
    expect(result.format).toBe('svg');
  });

  it('should coerce size from string', () => {
    const result = qrQuerySchema.parse({ text: 'test', size: '300' });
    expect(result.size).toBe(300);
  });

  it('should reject size exceeding max', () => {
    expect(() => qrQuerySchema.parse({ text: 'test', size: 5000 })).toThrow();
  });

  it('should accept error correction levels', () => {
    for (const ecLevel of ['L', 'M', 'Q', 'H']) {
      const result = qrQuerySchema.parse({ text: 'test', ecLevel });
      expect(result.ecLevel).toBe(ecLevel);
    }
  });
});
