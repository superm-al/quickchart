import { describe, it, expect } from 'vitest';
import { renderGraphviz } from '../../../src/services/graphviz.service.js';

describe('graphviz.service', () => {
  it('should render SVG output', async () => {
    const buf = await renderGraphviz({
      graph: 'digraph { a -> b }',
      format: 'svg',
      engine: 'dot',
    });
    expect(buf).toBeInstanceOf(Buffer);
    const svg = buf.toString('utf8');
    expect(svg).toContain('<svg');
  });

  it('should render PNG output', async () => {
    const buf = await renderGraphviz({
      graph: 'digraph { a -> b }',
      format: 'png',
      engine: 'dot',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
  });

  it('should support different engines', async () => {
    const buf = await renderGraphviz({
      graph: 'digraph { a -> b }',
      format: 'svg',
      engine: 'neato',
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.toString('utf8')).toContain('<svg');
  });

  it('should throw on invalid graph', async () => {
    await expect(
      renderGraphviz({
        graph: 'this is not valid dot',
        format: 'svg',
        engine: 'dot',
      }),
    ).rejects.toThrow('Graphviz rendering failed');
  });
});
