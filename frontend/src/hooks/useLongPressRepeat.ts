import { useCallback, useRef } from 'react';

const DEFAULT_DELAY_MS = 400;
const DEFAULT_INTERVAL_MS = 80;

export function useLongPressRepeat(
  action: () => void,
  delayMs = DEFAULT_DELAY_MS,
  intervalMs = DEFAULT_INTERVAL_MS
) {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (delayRef.current != null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    delayRef.current = setTimeout(() => {
      intervalRef.current = setInterval(action, intervalMs);
    }, delayMs);
  }, [action, clearTimers, delayMs, intervalMs]);

  const stop = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  return { start, stop };
}
