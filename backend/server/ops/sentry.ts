/**
 * Optional Sentry init for the API process (free-tier friendly).
 * No-ops when SENTRY_DSN is unset or @sentry/node is not installed.
 * Failures never take down the Express process.
 */
import type { Express, ErrorRequestHandler } from 'express';
import { redactGeoFromUrl } from '@machinefit/shared';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let initialized = false;
let setupExpressErrorHandlerFn: ((app: Express) => void) | null = null;

function clampRate(n: number): number {
  if (!Number.isFinite(n)) return 0.05;
  return Math.min(1, Math.max(0, n));
}

function scrubEvent(event: {
  request?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}): typeof event | null {
  try {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      if (typeof event.request.url === 'string') {
        event.request.url = redactGeoFromUrl(event.request.url);
      }
      if (typeof event.request.query_string === 'string') {
        event.request.query_string = redactGeoFromUrl(`?${event.request.query_string}`).replace(
          /^\?/,
          ''
        );
      }
      const headers = event.request.headers;
      if (headers && typeof headers === 'object') {
        for (const key of Object.keys(headers as Record<string, unknown>)) {
          if (/authorization|cookie|set-cookie|token|secret|password|api[-_]?key/i.test(key)) {
            delete (headers as Record<string, unknown>)[key];
          }
        }
      }
    }
    if (event.extra) {
      for (const key of Object.keys(event.extra)) {
        if (/password|token|secret|authorization|refresh|cookie|email|body/i.test(key)) {
          delete event.extra[key];
        }
      }
    }
  } catch {
    /* ignore */
  }
  return event;
}

export async function initSentry(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const tracesSampleRate = clampRate(
    Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (env.NODE_ENV === 'production' ? 0.05 : 0))
  );
  const environment =
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.MF_DEPLOY_ENV ||
    env.NODE_ENV;

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment,
      release: process.env.RENDER_GIT_COMMIT || process.env.MF_APP_VERSION || undefined,
      tracesSampleRate,
      sendDefaultPii: false,
      integrations: [Sentry.expressIntegration()],
      tracesSampler: (samplingContext) => {
        const name = String(samplingContext.name ?? '');
        if (/\/health(?:\?|$)|\/ready(?:\?|$)|\/live(?:\?|$)|\/warmup(?:\?|$)/i.test(name)) {
          return 0;
        }
        return tracesSampleRate;
      },
      beforeSend(event) {
        return scrubEvent(event as { request?: Record<string, unknown>; extra?: Record<string, unknown> }) as typeof event;
      },
    });
    setupExpressErrorHandlerFn = (app) => {
      Sentry.setupExpressErrorHandler(app);
    };
    logger.warn('Sentry initialized', { environment });
  } catch (err) {
    setupExpressErrorHandlerFn = null;
    logger.warn('Sentry DSN set but @sentry/node failed to load', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Attach after routes, before app error middleware. Safe no-op if Sentry off. */
export function attachSentryExpressErrorHandler(app: Express): void {
  try {
    setupExpressErrorHandlerFn?.(app);
  } catch {
    /* ignore */
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
          if (/password|token|secret|authorization|refresh|cookie|email|body/i.test(k)) continue;
          scope.setExtra(k, v);
        }
      }
      Sentry.captureException(err);
    });
  } catch {
    /* ignore */
  }
}

/** Type helper so callers can optionally type middleware — unused if Sentry off. */
export type SentryExpressErrorHandler = ErrorRequestHandler;
