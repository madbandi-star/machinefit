import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_BASE_PATH: z.string().default('/api/v1'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  /** Public API base used to build local-upload media URLs (e.g. https://host/api/v1). */
  PUBLIC_API_BASE_URL: z.string().optional(),
  MOTIVATION_AUDIO_MAX_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  MOTIVATION_AUDIO_MAX_TRACKS: z.coerce.number().int().positive().default(20),
  MOTIVATION_AUDIO_BUCKET: z.string().default('motivation-audio'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
