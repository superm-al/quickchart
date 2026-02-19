import { describe, it, expect } from 'vitest';
import { graphvizQuerySchema } from '../../../src/schemas/graphviz.schema.js';

describe('graphvizQuerySchema', () => {
  it('should validate minimal valid input', () => {
    const result = graphvizQuerySchema.parse({ graph: 'digraph { a -> b }' });
    expect(result.graph).toBe('digraph { a -> b }');
    expect(result.format).toBe('svg');
    expect(result.engine).toBe('dot');
  });

  it('should reject missing graph', () => {
    expect(() => graphvizQuerySchema.parse({})).toThrow();
  });

  it('should accept all valid engines', () => {
    const engines = ['dot', 'neato', 'twopi', 'circo', 'fdp', 'osage', 'patchwork', 'sfdp'];
    for (const engine of engines) {
      const result = graphvizQuerySchema.parse({ graph: 'digraph{}', engine });
      expect(result.engine).toBe(engine);
    }
  });

  it('should reject invalid engine', () => {
    expect(() => graphvizQuerySchema.parse({ graph: 'digraph{}', engine: 'invalid' })).toThrow();
  });

  it('should accept png format', () => {
    const result = graphvizQuerySchema.parse({ graph: 'digraph{}', format: 'png' });
    expect(result.format).toBe('png');
  });

  it('should coerce dimensions from strings', () => {
    const result = graphvizQuerySchema.parse({ graph: 'digraph{}', width: '400', height: '300' });
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });
});
