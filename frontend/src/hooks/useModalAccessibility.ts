import { useEffect, useRef } from 'react';

interface UseModalAccessibilityOptions {
  open: boolean;
  onClose: () => void;
  /** When false, Escape does not close (default true). */
  closeOnEscape?: boolean;
  /**
   * Preferred first focus target after open.
   * When omitted, focuses the first text-like field, then any focusable control.
   */
  initialFocusSelector?: string;
}

/**
 * Locks body scroll, closes on Escape, and restores focus when a modal closes.
 * Callback/selector values are read from refs so parent re-renders do not re-run
 * this effect and steal focus while the user is typing.
 */
export function useModalAccessibility({
  open,
  onClose,
  closeOnEscape = true,
  initialFocusSelector,
}: UseModalAccessibilityOptions) {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const initialFocusSelectorRef = useRef(initialFocusSelector);
  const closeOnEscapeRef = useRef(closeOnEscape);

  onCloseRef.current = onClose;
  initialFocusSelectorRef.current = initialFocusSelector;
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const root = containerRef.current;
      if (!root) return;

      const selector = initialFocusSelectorRef.current;
      const preferred = selector ? root.querySelector<HTMLElement>(selector) : null;
      const textField = root.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]), textarea:not([disabled]), select:not([disabled])'
      );
      const anyFocusable = root.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (preferred ?? textField ?? anyFocusable)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = [
        ...containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => {
        if (el.getAttribute('type') === 'file') return false;
        return el.offsetParent !== null || el === document.activeElement;
      });

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
      previouslyFocused.current = null;
    };
  }, [open]);

  return containerRef;
}
