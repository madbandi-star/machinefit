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
  /** pg.Pool max connections for this Node process (default 20). */
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(20),
  DATABASE_POOL_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  DATABASE_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  /**
   * Fraction of successful API requests that write ops latency samples in production.
   * Errors (status ≥ 500) are always recorded. Default 0.05 (5%).
   */
  OPS_API_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.05),
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
  MOTIVATION_COVER_IMAGE_BUCKET: z.string().default('motivation-covers'),
  MUSCLE_GROUP_IMAGE_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MUSCLE_GROUP_IMAGE_BUCKET: z.string().default('muscle-group-images'),
  MACHINE_COVER_IMAGE_BUCKET: z.string().default('machine-cover-images'),
  BRAND_ASSET_IMAGE_BUCKET: z.string().default('brand-assets'),
  UGC_IMAGE_BUCKET: z.string().default('ugc-images'),
  NOTICE_ATTACHMENT_BUCKET: z.string().default('notice-attachments'),
  NOTICE_ATTACHMENT_MAX_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),
  BANNER_IMAGE_BUCKET: z.string().default('banner-images'),
  BANNER_IMAGE_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  /** Private Supabase Storage bucket for user/system backup files. */
  BACKUP_STORAGE_BUCKET: z.string().default('backup'),
  /** OAuth / social login (optional — endpoints error when unset). */
  GOOGLE_CLIENT_ID: z.string().optional(),
  /**
   * Kakao JavaScript key served to the SPA via GET /auth/oauth/client-config.
   * Do not commit real values; rotate in Kakao Developers + Render env.
   */
  KAKAO_JS_KEY: z.string().optional(),
  KAKAO_REST_API_KEY: z.string().optional(),
  /** Optional — required only if Kakao console enables Client Secret. */
  KAKAO_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  /** Optional Apple Services ID return URL override for the SPA. */
  APPLE_REDIRECT_URI: z.string().optional(),
  /** Soft Express request deadline (ms). 0 disables. Default 30s. */
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(0).default(30_000),
  /** Grace period for in-flight requests on SIGTERM (ms). */
  SHUTDOWN_GRACE_MS: z.coerce.number().int().positive().default(15_000),
  /** Optional Sentry DSN — enables error/performance monitoring when set. */
  SENTRY_DSN: z.string().optional(),
  /** Overrides NODE_ENV / MF_DEPLOY_ENV for Sentry environment tag. */
  SENTRY_ENVIRONMENT: z.string().optional(),
  /** 0–1; default 0.05 in production when unset (see ops/sentry.ts). */
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  /** Optional webhook URL for critical DR alerts (Slack/Discord compatible). */
  DR_ALERT_WEBHOOK_URL: z.string().optional(),
  /**
   * Active payment provider id. Default `dummy` (no real charges).
   * Set `polar` when Polar credentials are configured on Render.
   */
  PAYMENT_PROVIDER: z
    .enum(['dummy', 'toss', 'portone', 'lemonsqueezy', 'polar', 'stripe', 'google', 'apple'])
    .default('dummy'),
  /** Public frontend origin+path for invite / Polar return URLs. */
  FRONTEND_BASE_URL: z.string().optional(),
  /** Polar organization access token (never commit). */
  POLAR_ACCESS_TOKEN: z.string().optional(),
  /** Polar webhook signing secret (Standard Webhooks / whsec_). */
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_ORGANIZATION_ID: z.string().optional(),
  /** Polar Product ID for MachineFit Premium (monthly). */
  POLAR_PREMIUM_PRODUCT_ID: z.string().optional(),
  /** `sandbox` → sandbox-api.polar.sh ; otherwise production. */
  POLAR_SERVER: z.enum(['sandbox', 'production']).default('production'),
  POLAR_SUCCESS_URL: z.string().optional(),
  POLAR_RETURN_URL: z.string().optional(),
});

/**
 * Strip accidental `KEY=value` pastes from Render/dashboard env values.
 * e.g. GOOGLE_CLIENT_ID set to `GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com`
 * would otherwise break Google OAuth with invalid_client.
 */
function sanitizeEnvAssignment(raw: string | undefined, envKey: string): string | undefined {
  if (raw == null) return undefined;
  let v = String(raw).trim();
  if (!v) return undefined;
  const prefix = `${envKey}=`;
  if (v.startsWith(prefix)) {
    v = v.slice(prefix.length).trim();
  }
  // Also strip wrapping quotes from copy-paste
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

const rawEnv = {
  ...process.env,
  SUPABASE_URL: derivedSupabaseUrl,
  GOOGLE_CLIENT_ID: sanitizeEnvAssignment(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
  KAKAO_JS_KEY: sanitizeEnvAssignment(process.env.KAKAO_JS_KEY, 'KAKAO_JS_KEY'),
  KAKAO_REST_API_KEY: sanitizeEnvAssignment(process.env.KAKAO_REST_API_KEY, 'KAKAO_REST_API_KEY'),
  KAKAO_CLIENT_SECRET: sanitizeEnvAssignment(process.env.KAKAO_CLIENT_SECRET, 'KAKAO_CLIENT_SECRET'),
  APPLE_CLIENT_ID: sanitizeEnvAssignment(process.env.APPLE_CLIENT_ID, 'APPLE_CLIENT_ID'),
  APPLE_REDIRECT_URI: sanitizeEnvAssignment(process.env.APPLE_REDIRECT_URI, 'APPLE_REDIRECT_URI'),
};

export const env = envSchema.parse(rawEnv);

export type Env = z.infer<typeof envSchema>;
