import { describe, it, expect } from 'vitest';
import { renderQr } from '../../../src/services/qr.service.js';

describe('qr.service', () => {
  it('should render a PNG QR code', async () => {
    const buf = await renderQr({
      text: 'hello world',
      format: 'png',
      size: 150,
      margin: 4,
      dark: '000',
      light: 'fff',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it('should render an SVG QR code', async () => {
    const buf = await renderQr({
      text: 'hello world',
      format: 'svg',
      size: 150,
      margin: 4,
      dark: '000',
      light: 'fff',
    });
    expect(buf).toBeInstanceOf(Buffer);
    const svg = buf.toString('utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should throw QrGenerationError on invalid input', async () => {
    await expect(
      renderQr({
        text: '',
        format: 'png',
        size: 150,
        margin: 4,
        dark: '000',
        light: 'fff',
      }),
    ).rejects.toThrow();
  });
});
