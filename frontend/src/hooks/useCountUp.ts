import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/** Animate integer from 0 → target. Instant when reduced-motion. */
export function useCountUp(target: number, durationMs = 900, enabled = true): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced || !enabled ? target : 0);

  useEffect(() => {
    if (!enabled || reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const from = 0;
    const safeTarget = Number.isFinite(target) ? target : 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(from + (safeTarget - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, enabled, reduced]);

  return value;
}
