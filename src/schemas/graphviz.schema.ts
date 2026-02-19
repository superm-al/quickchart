import { z } from 'zod';

export const graphvizQuerySchema = z.object({
  graph: z.string().min(1, 'graph is required'),
  format: z.enum(['svg', 'png']).default('svg'),
  engine: z
    .enum(['dot', 'neato', 'twopi', 'circo', 'fdp', 'osage', 'patchwork', 'sfdp'])
    .default('dot'),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
});

export type GraphvizQuery = z.infer<typeof graphvizQuerySchema>;
