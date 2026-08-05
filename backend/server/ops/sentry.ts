/**
 * Optional Sentry init for the API process.
 * No-ops when SENTRY_DSN is unset or @sentry/node is not installed.
 */
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let initialized = false;

export async function initSentry(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.MF_DEPLOY_ENV || env.NODE_ENV,
      release: process.env.RENDER_GIT_COMMIT || process.env.MF_APP_VERSION || undefined,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.05 : 0.2,
    });
    logger.warn('Sentry initialized', { environment: process.env.MF_DEPLOY_ENV || env.NODE_ENV });
  } catch (err) {
    logger.warn('Sentry DSN set but @sentry/node failed to load', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function captureSentryException(
  err: unknown,
  meta?: Record<string, unknown>
): Promise<void> {
  if (!env.SENTRY_DSN?.trim()) return;
  try {
    const Sentry = await import('@sentry/node');
    Sentry.withScope((scope) => {
      if (meta) {
        for (const [k, v] of Object.entries(meta)) {
          scope.setExtra(k, v);
        }
      }
      Sentry.captureException(err);
    });
  } catch {
    /* ignore */
  }
}
