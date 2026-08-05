/**
 * Retry with exponential backoff — transient failures only.
 * Infinite retry is forbidden (maxAttempts hard cap).
 */
export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Return true to retry this error. */
  isRetryable?: (err: unknown) => boolean;
  label?: string;
};

const DEFAULT_RETRYABLE = (err: unknown): boolean => {
  const e = err as { code?: string; message?: string; status?: number; statusCode?: number };
  const code = String(e?.code ?? '');
  const msg = String(e?.message ?? err ?? '');
  const status = e?.status ?? e?.statusCode;
  if (status && [408, 429, 500, 502, 503, 504].includes(Number(status))) return true;
  if (
    /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|socket hang up|timeout|Too Many|429|503|502/i.test(
      `${code} ${msg}`
    )
  ) {
    return true;
  }
  return false;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = Math.min(5, Math.max(1, options.maxAttempts ?? 3));
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 2_000;
  const isRetryable = options.isRetryable ?? DEFAULT_RETRYABLE;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= maxAttempts || !isRetryable(err)) throw err;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }
  throw lastError;
}
