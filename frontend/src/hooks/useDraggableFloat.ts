import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';

export interface FloatPosition {
  left: number;
  top: number;
}

const STORAGE_PREFIX = 'mf-float-pos:';
const DRAG_THRESHOLD_PX = 6;
const DEFAULT_MARGIN = 8;

function storageKey(id: string): string {
  return `${STORAGE_PREFIX}${id}`;
}

function loadPosition(id: string): FloatPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FloatPosition>;
    if (typeof parsed.left !== 'number' || typeof parsed.top !== 'number') return null;
    if (!Number.isFinite(parsed.left) || !Number.isFinite(parsed.top)) return null;
    return { left: parsed.left, top: parsed.top };
  } catch {
    return null;
  }
}

function savePosition(id: string, pos: FloatPosition): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(id), JSON.stringify(pos));
  } catch {
    // ignore quota / private mode
  }
}

function clampPosition(
  left: number,
  top: number,
  width: number,
  height: number,
  margin: number
): FloatPosition {
  const maxLeft = Math.max(margin, window.innerWidth - width - margin);
  const maxTop = Math.max(margin, window.innerHeight - height - margin);
  return {
    left: Math.min(Math.max(margin, left), maxLeft),
    top: Math.min(Math.max(margin, top), maxTop),
  };
}

function isDragBlockedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, iframe, label, [role="button"], [data-no-drag]'
    )
  );
}

export interface UseDraggableFloatOptions {
  /** Stable id for localStorage persistence. */
  id: string;
  /** When false, drag is disabled (e.g. inline rest banner). */
  enabled?: boolean;
  margin?: number;
}

export interface UseDraggableFloatResult {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties | undefined;
  isDragging: boolean;
  isPositioned: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  floatClassName: string;
}

/**
 * Pointer-driven drag for floating mini modules (touch + mouse).
 * First layout uses CSS defaults until the user drags; then left/top stick.
 */
export function useDraggableFloat({
  id,
  enabled = true,
  margin = DEFAULT_MARGIN,
}: UseDraggableFloatOptions): UseDraggableFloatResult {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<FloatPosition | null>(() => loadPosition(id));
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    moved: boolean;
  } | null>(null);

  const reclamp = useCallback(() => {
    const el = ref.current;
    if (!el || !pos) return;
    const rect = el.getBoundingClientRect();
    const next = clampPosition(pos.left, pos.top, rect.width, rect.height, margin);
    if (next.left !== pos.left || next.top !== pos.top) {
      setPos(next);
      savePosition(id, next);
    }
  }, [id, margin, pos]);

  useEffect(() => {
    if (!enabled || !pos) return;
    reclamp();
    window.addEventListener('resize', reclamp);
    window.addEventListener('orientationchange', reclamp);
    return () => {
      window.removeEventListener('resize', reclamp);
      window.removeEventListener('orientationchange', reclamp);
    };
  }, [enabled, pos, reclamp]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      if (isDragBlockedTarget(event.target)) return;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origLeft: rect.left,
        origTop: rect.top,
        moved: false,
      };

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;
        const dx = ev.clientX - drag.startX;
        const dy = ev.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        drag.moved = true;
        setIsDragging(true);
        const node = ref.current;
        if (!node) return;
        const { width, height } = node.getBoundingClientRect();
        const next = clampPosition(
          drag.origLeft + dx,
          drag.origTop + dy,
          width,
          height,
          margin
        );
        setPos(next);
        ev.preventDefault();
      };

      const onUp = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;
        dragRef.current = null;
        setIsDragging(false);
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (drag.moved) {
          const node = ref.current;
          if (node) {
            const rectNow = node.getBoundingClientRect();
            const next = clampPosition(rectNow.left, rectNow.top, rectNow.width, rectNow.height, margin);
            setPos(next);
            savePosition(id, next);
            // Swallow the synthetic click that often follows a touch-drag.
            const suppressClick = (clickEvent: Event) => {
              clickEvent.preventDefault();
              clickEvent.stopPropagation();
              node.removeEventListener('click', suppressClick, true);
            };
            node.addEventListener('click', suppressClick, true);
            window.setTimeout(() => node.removeEventListener('click', suppressClick, true), 0);
          }
        }
      };

      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [enabled, id, margin]
  );

  const style: CSSProperties | undefined =
    enabled && pos
      ? {
          left: pos.left,
          top: pos.top,
          right: 'auto',
          bottom: 'auto',
          transform: 'none',
        }
      : undefined;

  const floatClassName = [
    enabled ? 'mf-float--draggable' : '',
    enabled && pos ? 'mf-float--positioned' : '',
    isDragging ? 'mf-float--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    ref,
    style,
    isDragging,
    isPositioned: Boolean(enabled && pos),
    onPointerDown,
    floatClassName,
  };
}
