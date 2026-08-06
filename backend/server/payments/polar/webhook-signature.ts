/**
 * Standard Webhooks signature verification (Polar).
 * @see https://docs.polar.sh/integrate/webhooks/delivery
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) return '';
  const v = headers[key];
  return Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
}

function decodeSecret(secret: string): Buffer {
  const trimmed = secret.trim();
  if (trimmed.startsWith('whsec_')) {
    return Buffer.from(trimmed.slice('whsec_'.length), 'base64');
  }
  // Polar dashboard often shows raw base64
  try {
    return Buffer.from(trimmed, 'base64');
  } catch {
    return Buffer.from(trimmed, 'utf8');
  }
}

/**
 * Verify Polar / Standard Webhooks HMAC signature.
 * Returns false when secret missing or signature mismatch.
 */
export function verifyPolarWebhookSignature(
  secret: string | undefined,
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): { ok: boolean; reason?: string; webhookId?: string } {
  if (!secret?.trim()) {
    return { ok: false, reason: 'POLAR_WEBHOOK_SECRET not configured' };
  }

  const webhookId = headerValue(headers, 'webhook-id');
  const timestamp = headerValue(headers, 'webhook-timestamp');
  const signatureHeader = headerValue(headers, 'webhook-signature');

  if (!webhookId || !timestamp || !signatureHeader) {
    return { ok: false, reason: 'Missing webhook signature headers' };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'Invalid webhook timestamp' };
  }
  // Reject timestamps older than 5 minutes (replay protection)
  const skewSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (skewSec > 300) {
    return { ok: false, reason: 'Webhook timestamp outside tolerance' };
  }

  const key = decodeSecret(secret);
  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', key).update(signedContent, 'utf8').digest('base64');

  const candidates = signatureHeader.split(/\s+/).flatMap((part) => {
    const [, sig] = part.split(',');
    return sig ? [sig.trim()] : [];
  });

  for (const cand of candidates) {
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(cand);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return { ok: true, webhookId };
      }
    } catch {
      // continue
    }
  }

  return { ok: false, reason: 'Invalid webhook signature', webhookId };
}
