import { useCallback, useRef, type MouseEvent, type PointerEvent } from 'react';

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, summary, [role="button"], [role="link"], [role="switch"], [role="checkbox"], [contenteditable="true"]';

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  return Boolean(target.closest(INTERACTIVE_SELECTOR));
}

/**
 * Double-tap (touch) / double-click (mouse) on non-interactive surfaces runs `action`.
 */
export function useDoubleTapAction(
  action: () => void,
  options?: { delayMs?: number; enabled?: boolean }
) {
  const delayMs = options?.delayMs ?? 320;
  const enabled = options?.enabled ?? true;
  const lastTapAtRef = useRef(0);

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!enabled) return;
      if (event.pointerType === 'mouse') return;
      if (isInteractiveTarget(event.target)) return;

      const now = Date.now();
      if (now - lastTapAtRef.current <= delayMs) {
        lastTapAtRef.current = 0;
        action();
        return;
      }
      lastTapAtRef.current = now;
    },
    [action, delayMs, enabled]
  );

  const onDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled) return;
      if (isInteractiveTarget(event.target)) return;
      action();
    },
    [action, enabled]
  );

  return { onPointerUp, onDoubleClick };
}
