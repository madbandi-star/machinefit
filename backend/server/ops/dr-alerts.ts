/**
 * Pluggable DR alert notifier (Sentry / Slack / Discord / webhook).
 * Failures never throw — safe to call from health/ops paths.
 */
import { env } from '../config/env.js';
import { dispatchOpsAlert } from '../ops/ops-alert-channels.js';
import { logger } from '../utils/logger.js';
import { isProductionOps } from '../ops/ops-runtime.js';

export type DrAlertInput = {
  alertKey: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  meta?: Record<string, unknown>;
};

async function postWebhook(url: string, body: unknown): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4_000);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire DR alert to configured channels.
 * - Always writes a structured warn/error log
 * - Uses ops_alert_channels (Slack/Discord) when configured
 * - Optional DR_ALERT_WEBHOOK_URL / SENTRY_DSN env hooks
 */
export async function notifyDrAlert(alert: DrAlertInput): Promise<void> {
  const logMeta = { alertKey: alert.alertKey, ...alert.meta };
  if (alert.severity === 'critical') {
    logger.error(alert.title, { message: alert.message, ...logMeta });
  } else {
    logger.warn(alert.title, { message: alert.message, ...logMeta });
  }

  try {
    await dispatchOpsAlert({
      alertKey: alert.alertKey,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
    });
  } catch {
    /* ignore */
  }

  if (env.DR_ALERT_WEBHOOK_URL) {
    try {
      await postWebhook(env.DR_ALERT_WEBHOOK_URL, {
        text: `[${alert.severity}] ${alert.title}\n${alert.message}`,
        content: `[${alert.severity}] ${alert.title}\n${alert.message}`,
        alert,
      });
    } catch {
      /* ignore */
    }
  }

  // Sentry SDK when DSN + package present.
  if (env.SENTRY_DSN && isProductionOps()) {
    void import('./sentry.js')
      .then(({ captureSentryException }) =>
        captureSentryException(new Error(`${alert.title}: ${alert.message}`), {
          alertKey: alert.alertKey,
          severity: alert.severity,
          ...alert.meta,
        })
      )
      .catch(() => undefined);
  }
}
