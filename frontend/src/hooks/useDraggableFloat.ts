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
  /**
   * `gpu` — update via transform/DOM during drag (no React re-renders).
   * Use for heavy surfaces like YouTube iframe mini players.
   */
  performanceMode?: 'default' | 'gpu';
  /** Fired once when drag threshold is crossed / released (gpu mode included). */
  onDragStart?: () => void;
  onDragEnd?: () => void;
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
  performanceMode = 'default',
  onDragStart,
  onDragEnd,
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
    width: number;
    height: number;
    moved: boolean;
    raf: number | null;
    pendingLeft: number;
    pendingTop: number;
  } | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const reclamp = useCallback(() => {
    const el = ref.current;
    const current = posRef.current;
    if (!el || !current) return;
    const rect = el.getBoundingClientRect();
    const next = clampPosition(current.left, current.top, rect.width, rect.height, margin);
    if (next.left !== current.left || next.top !== current.top) {
      setPos(next);
      savePosition(id, next);
    }
  }, [id, margin]);

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
        width: rect.width,
        height: rect.height,
        moved: false,
        raf: null,
        pendingLeft: rect.left,
        pendingTop: rect.top,
      };

      const applyGpuFrame = () => {
        const drag = dragRef.current;
        const node = ref.current;
        if (!drag || !node) return;
        drag.raf = null;
        const dx = drag.pendingLeft - drag.origLeft;
        const dy = drag.pendingTop - drag.origTop;
        // Beat any stylesheet !important leftovers.
        node.style.setProperty('transform', `translate3d(${dx}px, ${dy}px, 0)`, 'important');
      };

      const beginGpuDrag = (node: HTMLElement, drag: NonNullable<typeof dragRef.current>) => {
        // Do NOT add mf-float--positioned here — its CSS used to force transform:none.
        node.classList.add('mf-float--dragging', 'mf-float--gpu-drag');
        node.style.setProperty('left', `${drag.origLeft}px`, 'important');
        node.style.setProperty('top', `${drag.origTop}px`, 'important');
        node.style.setProperty('right', 'auto', 'important');
        node.style.setProperty('bottom', 'auto', 'important');
        node.style.setProperty('transform', 'translate3d(0,0,0)', 'important');
        node.style.willChange = 'transform';
        onDragStartRef.current?.();
      };

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;
        const dx = ev.clientX - drag.startX;
        const dy = ev.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

        const node = ref.current;
        if (!node) return;

        if (!drag.moved) {
          drag.moved = true;
          if (performanceMode === 'gpu') {
            beginGpuDrag(node, drag);
          } else {
            setIsDragging(true);
            onDragStartRef.current?.();
          }
        }

        const next = clampPosition(
          drag.origLeft + dx,
          drag.origTop + dy,
          drag.width,
          drag.height,
          margin
        );

        if (performanceMode === 'gpu') {
          drag.pendingLeft = next.left;
          drag.pendingTop = next.top;
          if (drag.raf == null) {
            drag.raf = window.requestAnimationFrame(applyGpuFrame);
          }
        } else {
          setPos(next);
        }
        ev.preventDefault();
      };

      const onUp = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;
        dragRef.current = null;
        if (drag.raf != null) {
          window.cancelAnimationFrame(drag.raf);
        }
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          // ignore
        }
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        if (!drag.moved) {
          if (performanceMode !== 'gpu') setIsDragging(false);
          return;
        }

        const node = ref.current;
        if (!node) {
          if (performanceMode !== 'gpu') setIsDragging(false);
          onDragEndRef.current?.();
          return;
        }

        let next: FloatPosition;
        if (performanceMode === 'gpu') {
          next = clampPosition(
            drag.pendingLeft,
            drag.pendingTop,
            drag.width,
            drag.height,
            margin
          );
          node.style.willChange = '';
          node.style.removeProperty('transform');
          node.style.setProperty('left', `${next.left}px`, 'important');
          node.style.setProperty('top', `${next.top}px`, 'important');
          node.style.setProperty('right', 'auto', 'important');
          node.style.setProperty('bottom', 'auto', 'important');
          node.classList.remove('mf-float--dragging', 'mf-float--gpu-drag');
          node.classList.add('mf-float--positioned');
        } else {
          const rectNow = node.getBoundingClientRect();
          next = clampPosition(rectNow.left, rectNow.top, rectNow.width, rectNow.height, margin);
          setIsDragging(false);
        }

        setPos(next);
        savePosition(id, next);
        onDragEndRef.current?.();

        const suppressClick = (clickEvent: Event) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          node.removeEventListener('click', suppressClick, true);
        };
        node.addEventListener('click', suppressClick, true);
        window.setTimeout(() => node.removeEventListener('click', suppressClick, true), 0);
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
    [enabled, id, margin, performanceMode]
  ); // onDragStart/End via refs — stable callback identity

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
