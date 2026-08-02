import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { buildPickerRange, findClosestPickerValue } from '@/utils/pickerRange';
import { formatNumericValue, getDecimalPlaces } from '@/utils/numericStep';
import '@/styles/components.css';

const ITEM_HEIGHT_DEFAULT = 36;
const ITEM_HEIGHT_COMPACT = 32;
const VISIBLE_ROWS_DEFAULT = 5;
const VISIBLE_ROWS_COMPACT = 3;
/** Ignore settle writes briefly after mount — expand/layout can fake scroll+touch. */
const MOUNT_GUARD_MS = 320;

interface ScrollPickerProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  ariaLabel?: string;
  formatValue?: (value: number) => string;
  defaultValue?: number;
  initializeOnMount?: boolean;
  size?: 'default' | 'compact';
}

function findOptionIndex(options: number[], value: number): number {
  if (options.length === 0) return 0;
  const closest = findClosestPickerValue(options, value);
  const index = options.indexOf(closest);
  return index >= 0 ? index : 0;
}

function getCenteredOptionIndex(
  container: HTMLElement,
  items: readonly (HTMLElement | null)[]
): number {
  const centerY = container.getBoundingClientRect().top + container.clientHeight / 2;
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let measured = 0;

  items.forEach((item, index) => {
    if (!item) return;
    const rect = item.getBoundingClientRect();
    if (rect.height <= 0) return;
    measured += 1;
    const itemCenter = rect.top + rect.height / 2;
    const distance = Math.abs(itemCenter - centerY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return measured > 0 ? bestIndex : -1;
}

export function ScrollPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  ariaLabel,
  formatValue,
  defaultValue,
  initializeOnMount = false,
  size = 'default',
}: ScrollPickerProps) {
  const itemHeight = size === 'compact' ? ITEM_HEIGHT_COMPACT : ITEM_HEIGHT_DEFAULT;
  const visibleRows = size === 'compact' ? VISIBLE_ROWS_COMPACT : VISIBLE_ROWS_DEFAULT;
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const syncingRef = useRef(false);
  const userInteractingRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);
  const mountedAtRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const options = useMemo(() => buildPickerRange(min, max, step), [min, max, step]);
  const decimalPlaces = getDecimalPlaces(step);

  const resolvedValue =
    value != null && Number.isFinite(value)
      ? findClosestPickerValue(options, value, defaultValue)
      : defaultValue != null && Number.isFinite(defaultValue)
        ? findClosestPickerValue(options, defaultValue)
        : (options[Math.floor(options.length / 2)] ?? min);

  const selectedIndex = findOptionIndex(options, resolvedValue);

  const formatOption = (option: number) => {
    if (formatValue) return formatValue(option);
    const formatted = formatNumericValue(option, decimalPlaces > 0 ? decimalPlaces : undefined);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const scrollToSelectedIndex = (behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container || container.clientHeight <= 0) return;

    syncingRef.current = true;
    container.scrollTo({ top: selectedIndex * itemHeight, behavior });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, behavior === 'smooth' ? 180 : 120);
  };

  useLayoutEffect(() => {
    scrollToSelectedIndex('auto');
  }, [selectedIndex, options.length, itemHeight]);

  // History/settings cards expand with height 0 first — re-sync when layout is ready.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (container.clientHeight > 0 && !userInteractingRef.current) {
        scrollToSelectedIndex('auto');
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [selectedIndex, options.length, itemHeight]);

  useEffect(() => {
    if (!initializeOnMount || value != null || defaultValue == null || options.length === 0) {
      return;
    }

    onChangeRef.current(findClosestPickerValue(options, defaultValue));
  }, [initializeOnMount, value, defaultValue, options]);

  const markUserInteraction = () => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Expand/open animations often deliver stray pointer/touch to newly mounted pickers.
    if (now - mountedAtRef.current < MOUNT_GUARD_MS) return;
    userInteractingRef.current = true;
  };

  const settleSelection = () => {
    const container = containerRef.current;
    if (!container || syncingRef.current || options.length === 0) return;

    if (container.clientHeight <= 0) {
      return;
    }

    if (!userInteractingRef.current) {
      scrollToSelectedIndex('auto');
      return;
    }

    const index = getCenteredOptionIndex(container, itemRefs.current);
    if (index < 0) {
      userInteractingRef.current = false;
      scrollToSelectedIndex('auto');
      return;
    }

    const next = options[index];
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const withinMountGuard = now - mountedAtRef.current < MOUNT_GUARD_MS;

    if (index !== selectedIndex) {
      syncingRef.current = true;
      container.scrollTo({ top: index * itemHeight, behavior: 'auto' });
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 120);
    }

    userInteractingRef.current = false;

    // During mount guard, never write a different value (especially range min).
    if (withinMountGuard) {
      scrollToSelectedIndex('auto');
      return;
    }

    if (next !== resolvedValue) {
      onChangeRef.current(next);
    }
  };

  const handleScroll = () => {
    if (syncingRef.current) return;

    if (scrollEndTimerRef.current != null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }

    scrollEndTimerRef.current = window.setTimeout(settleSelection, 80);
  };

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current != null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    },
    []
  );

  const padding = ((visibleRows - 1) / 2) * itemHeight;

  return (
    <div
      className={`scroll-picker${size === 'compact' ? ' scroll-picker--compact' : ''}`}
      aria-label={ariaLabel}
    >
      <div className="scroll-picker__frame">
        <div className="scroll-picker__highlight" aria-hidden style={{ height: itemHeight }} />
        <div
          ref={containerRef}
          className="scroll-picker__list"
          role="listbox"
          aria-label={ariaLabel}
          onScroll={handleScroll}
          onPointerDown={markUserInteraction}
          onWheel={markUserInteraction}
          onTouchStart={markUserInteraction}
          style={{
            height: itemHeight * visibleRows,
            paddingTop: padding,
            paddingBottom: padding,
          }}
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={option}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`scroll-picker__item${isSelected ? ' scroll-picker__item--selected' : ''}`}
                style={{ height: itemHeight }}
                onClick={() => {
                  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                  if (now - mountedAtRef.current < MOUNT_GUARD_MS) {
                    scrollToSelectedIndex('auto');
                    return;
                  }
                  markUserInteraction();
                  containerRef.current?.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
                  onChangeRef.current(option);
                  userInteractingRef.current = false;
                }}
              >
                {formatOption(option)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
