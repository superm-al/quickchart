import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3400),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().optional(),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  EXPRESS_JSON_LIMIT: z.string().default('100kb'),
  CHART_MAX_WIDTH: z.coerce.number().int().positive().default(3000),
  CHART_MAX_HEIGHT: z.coerce.number().int().positive().default(3000),
  DISABLE_METRICS: z
    .string()
    .transform((v) => v === '1' || v === 'true')
    .default(''),
});

export type AppConfig = z.infer<typeof envSchema>;

let _config: AppConfig | undefined;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = envSchema.parse(process.env);
  }
  return _config;
}
