import { z } from 'zod';
import { DEFAULT_QR_SIZE, MAX_QR_SIZE } from '../config/constants.js';

export const qrQuerySchema = z.object({
  text: z.string().min(1, 'text is required'),
  format: z.enum(['png', 'svg']).default('png'),
  size: z.coerce.number().int().positive().max(MAX_QR_SIZE).default(DEFAULT_QR_SIZE),
  margin: z.coerce.number().int().min(0).default(4),
  ecLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
  dark: z.string().default('000'),
  light: z.string().default('fff'),
  mode: z.string().optional(),
});

export type QrQuery = z.infer<typeof qrQuerySchema>;
