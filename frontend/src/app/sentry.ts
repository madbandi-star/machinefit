/**
 * Optional browser Sentry (free-tier friendly).
 * No-ops when VITE_SENTRY_DSN is unset. Never throws into app boot.
 */
import { useEffect } from 'react';
import { redactGeoFromUrl, type User } from '@machinefit/shared';

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();
const envName =
  (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined)?.trim() ||
  (import.meta.env.PROD ? 'production' : 'development');
const enableInDev =
  String(import.meta.env.VITE_SENTRY_ENABLE_DEV ?? '').toLowerCase() === 'true';
const tracesSampleRate = clampRate(
  Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? (import.meta.env.PROD ? 0.05 : 0))
);

let ready = false;

function clampRate(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function scrubEvent(event: Record<string, unknown>): Record<string, unknown> | null {
  try {
    const request = event.request as Record<string, unknown> | undefined;
    if (request) {
      delete request.cookies;
      delete request.data;
      if (typeof request.url === 'string') {
        request.url = redactGeoFromUrl(request.url);
      }
      if (typeof request.query_string === 'string') {
        request.query_string = redactGeoFromUrl(`?${request.query_string}`).replace(/^\?/, '');
      }
      const headers = request.headers;
      if (headers && typeof headers === 'object') {
        for (const key of Object.keys(headers as Record<string, unknown>)) {
          if (/authorization|cookie|set-cookie|token|secret|password|api[-_]?key/i.test(key)) {
            delete (headers as Record<string, unknown>)[key];
          }
        }
      }
    }
    const extra = event.extra as Record<string, unknown> | undefined;
    if (extra) {
      for (const key of Object.keys(extra)) {
        if (/password|token|secret|authorization|refresh|cookie|email/i.test(key)) {
          delete extra[key];
        }
      }
    }
  } catch {
    /* ignore scrub failures */
  }
  return event;
}

export async function initFrontendSentry(): Promise<void> {
  if (!dsn) return;
  if (!import.meta.env.PROD && !enableInDev) return;
  try {
    const Sentry = await import('@sentry/react');
    const { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } =
      await import('react-router-dom');

    Sentry.init({
      dsn,
      environment: envName,
      release: typeof __MF_BUILD_ID__ !== 'undefined' ? String(__MF_BUILD_ID__) : undefined,
      tracesSampleRate,
      sendDefaultPii: false,
      integrations: [
        Sentry.reactRouterV7BrowserTracingIntegration({
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        }),
      ],
      ignoreErrors: [
        'Failed to fetch dynamically imported module',
        /Loading chunk [\d]+ failed/i,
        /ChunkLoadError/i,
      ],
      beforeSend(event) {
        return scrubEvent(event as unknown as Record<string, unknown>) as unknown as typeof event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          const data = breadcrumb.data as Record<string, unknown> | undefined;
          if (data) {
            delete data.request_body;
            delete data.response_body;
            if (typeof data.url === 'string') {
              data.url = redactGeoFromUrl(data.url);
            }
          }
        }
        if (typeof breadcrumb.message === 'string') {
          breadcrumb.message = redactGeoFromUrl(breadcrumb.message);
        }
        return breadcrumb;
      },
    });
    ready = true;
  } catch {
    ready = false;
  }
}

/** id-only user context — never email/tokens. */
export function setSentryUser(user: Pick<User, 'id'> | null): void {
  if (!dsn || !ready) return;
  void import('@sentry/react')
    .then((Sentry) => {
      if (!user?.id) {
        Sentry.setUser(null);
        return;
      }
      Sentry.setUser({ id: user.id });
    })
    .catch(() => undefined);
}

export async function captureFrontendException(
  err: unknown,
  meta?: Record<string, unknown>
): Promise<void> {
  if (!dsn) return;
  try {
    const Sentry = await import('@sentry/react');
    Sentry.withScope((scope) => {
      if (meta) {
        for (const [k, v] of Object.entries(meta)) {
          if (/password|token|secret|authorization|refresh|cookie|email/i.test(k)) continue;
          scope.setExtra(k, v);
        }
      }
      Sentry.captureException(err);
    });
  } catch {
    /* ignore */
  }
}
