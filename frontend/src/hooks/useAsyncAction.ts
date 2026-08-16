import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FAILURE_COOLDOWN_MS,
  createAsyncActionGuard,
  getRetryAfterMs,
} from '@/utils/asyncActionGuard';

export interface UseAsyncActionOptions {
  /** Cooldown after failure when Retry-After is absent (default 3000ms). */
  failureCooldownMs?: number;
}

/**
 * Ref-level lock for user actions that hit the API.
 * Concurrent taps are ignored; failures apply a short cooldown (Retry-After aware).
 */
export function useAsyncAction(options?: UseAsyncActionOptions) {
  const failureCooldownMs = options?.failureCooldownMs ?? DEFAULT_FAILURE_COOLDOWN_MS;
  const guardRef = useRef(createAsyncActionGuard({ failureCooldownMs }));
  const [isPending, setIsPending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startCooldownUi = useCallback((ms: number) => {
    clearTick();
    const until = Date.now() + ms;
    setCooldownSeconds(Math.max(1, Math.ceil(ms / 1000)));
    tickRef.current = setInterval(() => {
      const left = Math.max(0, until - Date.now());
      setCooldownSeconds(left <= 0 ? 0 : Math.ceil(left / 1000));
      if (left <= 0) clearTick();
    }, 200);
  }, []);

  useEffect(() => () => clearTick(), []);

  useEffect(() => {
    guardRef.current = createAsyncActionGuard({ failureCooldownMs });
  }, [failureCooldownMs]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      setIsPending(true);
      try {
        const outcome = await guardRef.current.run(fn);
        setIsPending(false);
        if (!outcome.started) return undefined;
        return outcome.value;
      } catch (error) {
        setIsPending(false);
        startCooldownUi(getRetryAfterMs(error, failureCooldownMs));
        throw error;
      }
    },
    [failureCooldownMs, startCooldownUi]
  );

  const isCoolingDown = cooldownSeconds > 0;

  return {
    run,
    isPending,
    isCoolingDown,
    cooldownSeconds,
    isBlocked: isPending || isCoolingDown,
  };
}
