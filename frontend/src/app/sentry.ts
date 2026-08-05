/**
 * Optional browser Sentry init.
 * Loads only when VITE_SENTRY_DSN is set at build time.
 */
const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();

export async function initFrontendSentry(): Promise<void> {
  if (!dsn) return;
  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      release: typeof __MF_BUILD_ID__ !== 'undefined' ? String(__MF_BUILD_ID__) : undefined,
      tracesSampleRate: import.meta.env.PROD ? 0.05 : 0.2,
    });
  } catch {
    // Package may be absent in local installs — fail soft.
  }
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
        for (const [k, v] of Object.entries(meta)) scope.setExtra(k, v);
      }
      Sentry.captureException(err);
    });
  } catch {
    /* ignore */
  }
}
