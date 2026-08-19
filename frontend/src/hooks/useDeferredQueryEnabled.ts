/**
 * Enable a React Query after a short idle delay.
 * Cuts entry fan-out without removing UI data (same content, later fetch).
 */
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export function useDeferredQueryEnabled(
  baseEnabled: boolean,
  delayMs = 200
): boolean {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!baseEnabled) {
      setReady(false);
      return;
    }
    if (reduced) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const mark = () => {
      if (!cancelled) setReady(true);
    };

    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    if (typeof ric === 'function') {
      idleId = ric(mark, { timeout: delayMs + 400 });
      timeoutId = setTimeout(mark, delayMs + 600);
    } else {
      timeoutId = setTimeout(mark, delayMs);
    }

    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      const cancel = (
        window as Window & { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback;
      if (idleId != null && typeof cancel === 'function') {
        cancel(idleId);
      }
    };
  }, [baseEnabled, delayMs, reduced]);

  return baseEnabled && ready;
}
