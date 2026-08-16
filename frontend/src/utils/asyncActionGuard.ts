import axios from 'axios';

export const DEFAULT_FAILURE_COOLDOWN_MS = 3_000;

/** Axios / AppError helpers for retry cooldown. */
export function getRetryAfterMs(error: unknown, fallbackMs = DEFAULT_FAILURE_COOLDOWN_MS): number {
  if (!axios.isAxiosError(error)) return fallbackMs;

  const header = error.response?.headers?.['retry-after'] ?? error.response?.headers?.['Retry-After'];
  if (typeof header === 'string' && header.trim()) {
    const asInt = Number.parseInt(header, 10);
    if (Number.isFinite(asInt) && asInt >= 0) {
      return Math.min(60_000, Math.max(1_000, asInt * 1000));
    }
    const asDate = Date.parse(header);
    if (Number.isFinite(asDate)) {
      return Math.min(60_000, Math.max(1_000, asDate - Date.now()));
    }
  }

  const bodyRetry = (
    error.response?.data as { error?: { retryAfter?: number } } | undefined
  )?.error?.retryAfter;
  if (typeof bodyRetry === 'number' && Number.isFinite(bodyRetry) && bodyRetry >= 0) {
    return Math.min(60_000, Math.max(1_000, bodyRetry * 1000));
  }

  const attached = (error as { retryAfterMs?: number }).retryAfterMs;
  if (typeof attached === 'number' && Number.isFinite(attached) && attached > 0) {
    return Math.min(60_000, Math.max(1_000, attached));
  }

  if (error.response?.status === 429) {
    return Math.max(fallbackMs, 3_000);
  }

  return fallbackMs;
}

export function createIdempotencyKey(prefix = 'mf'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type AsyncActionRunResult<T> =
  | { started: false }
  | { started: true; value: T };

/**
 * Sync in-flight + failure-cooldown lock (usable outside React).
 * Concurrent calls are ignored until unlock / cooldown ends.
 */
export function createAsyncActionGuard(options?: { failureCooldownMs?: number }) {
  const failureCooldownMs = options?.failureCooldownMs ?? DEFAULT_FAILURE_COOLDOWN_MS;
  let locked = false;
  let cooldownUntil = 0;

  return {
    isBlocked(): boolean {
      return locked || Date.now() < cooldownUntil;
    },
    cooldownRemainingMs(): number {
      return Math.max(0, cooldownUntil - Date.now());
    },
    async run<T>(fn: () => Promise<T>): Promise<AsyncActionRunResult<T>> {
      if (locked || Date.now() < cooldownUntil) {
        return { started: false };
      }
      locked = true;
      try {
        const value = await fn();
        locked = false;
        return { started: true, value };
      } catch (error) {
        const ms = getRetryAfterMs(error, failureCooldownMs);
        cooldownUntil = Date.now() + ms;
        locked = false;
        throw error;
      }
    },
  };
}
