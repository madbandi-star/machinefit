import { z } from 'zod';

function deriveSupabaseUrl(databaseUrl: string | undefined): string | undefined {
  if (!databaseUrl) return undefined;
  const pooler = databaseUrl.match(/postgres\.([a-z0-9]{10,})\b/i);
  if (pooler?.[1]) return `https://${pooler[1]}.supabase.co`;
  const direct = databaseUrl.match(/@db\.([a-z0-9]+)\.supabase\.co\b/i);
  if (direct?.[1]) return `https://${direct[1]}.supabase.co`;
  return undefined;
}

const derivedSupabaseUrl = process.env.SUPABASE_URL || deriveSupabaseUrl(process.env.DATABASE_URL);

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
  MUSCLE_GROUP_IMAGE_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MUSCLE_GROUP_IMAGE_BUCKET: z.string().default('muscle-group-images'),
  MACHINE_COVER_IMAGE_BUCKET: z.string().default('machine-cover-images'),
  /**
   * When true, registration forces DEMO_PASSWORD (demo/staging convenience).
   * Defaults to false in production, true otherwise. Override with DEMO_AUTH=true|false.
   */
  DEMO_AUTH: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return process.env.NODE_ENV !== 'production';
    }),
  /** OAuth / social login (optional — endpoints error when unset). */
  GOOGLE_CLIENT_ID: z.string().optional(),
  KAKAO_REST_API_KEY: z.string().optional(),
  /** Optional — required only if Kakao console enables Client Secret. */
  KAKAO_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
});

export const env = envSchema.parse({
  ...process.env,
  SUPABASE_URL: derivedSupabaseUrl,
});

export type Env = z.infer<typeof envSchema>;
