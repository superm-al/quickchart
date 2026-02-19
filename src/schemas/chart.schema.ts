import { z } from 'zod';
import {
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  DEFAULT_DEVICE_PIXEL_RATIO,
  MAX_WIDTH,
  MAX_HEIGHT,
} from '../config/constants.js';

export const chartSchema = z.object({
  chart: z.string().min(1, 'chart is required'),
  width: z.coerce.number().int().positive().max(MAX_WIDTH).default(DEFAULT_WIDTH),
  height: z.coerce.number().int().positive().max(MAX_HEIGHT).default(DEFAULT_HEIGHT),
  format: z.enum(['png', 'svg', 'webp', 'pdf']).default('png'),
  backgroundColor: z.string().default('transparent'),
  devicePixelRatio: z.coerce
    .number()
    .min(0.5)
    .max(4)
    .default(DEFAULT_DEVICE_PIXEL_RATIO),
  encoding: z.enum(['url', 'base64']).default('url'),
});

export type ChartQuery = z.infer<typeof chartSchema>;
