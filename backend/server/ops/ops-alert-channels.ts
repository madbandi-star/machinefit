/**
 * Pluggable alert delivery (Slack / Discord / Email / Webhook).
 * Channels are read from ops_alert_channels; failures never throw to callers.
 */
import { getPool } from '../config/database.js';
import { isProductionOps } from './ops-runtime.js';

export type OpsAlertPayload = {
  alertKey: string;
  severity: string;
  title: string;
  message: string;
};

async function postJson(url: string, body: unknown, headers?: Record<string, string>): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4_000);
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchOpsAlert(alert: OpsAlertPayload): Promise<void> {
  if (!isProductionOps()) return;
  const db = getPool();
  if (!db) return;

  try {
    const { rows } = await db.query<{
      channel_type: string;
      config: Record<string, unknown>;
    }>(
      `SELECT channel_type, config
         FROM ops_alert_channels
        WHERE enabled = TRUE
        LIMIT 20`
    );

    await Promise.all(
      rows.map(async (row) => {
        try {
          const cfg = row.config ?? {};
          const webhookUrl = typeof cfg.url === 'string' ? cfg.url : null;
          if (!webhookUrl) return;

          if (row.channel_type === 'slack' || row.channel_type === 'discord' || row.channel_type === 'webhook') {
            await postJson(webhookUrl, {
              text: `[${alert.severity}] ${alert.title}\n${alert.message}`,
              content: `[${alert.severity}] ${alert.title}\n${alert.message}`,
              alert,
            });
            return;
          }

          if (row.channel_type === 'email') {
            // Reserved: integrate SendGrid/SES via cfg later.
            if (typeof cfg.webhookUrl === 'string') {
              await postJson(cfg.webhookUrl, { type: 'email', alert, to: cfg.to });
            }
          }
        } catch {
          /* swallow per-channel errors */
        }
      })
    );
  } catch {
    /* table may not exist yet during deploy race */
  }
}
