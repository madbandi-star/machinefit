import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { buildPickerRange, findClosestPickerValue } from '@/utils/pickerRange';
import { formatNumericValue, getDecimalPlaces } from '@/utils/numericStep';
import '@/styles/components.css';

const ITEM_HEIGHT_DEFAULT = 36;
const ITEM_HEIGHT_COMPACT = 32;
const VISIBLE_ROWS_DEFAULT = 5;
const VISIBLE_ROWS_COMPACT = 3;

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

  items.forEach((item, index) => {
    if (!item) return;
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const distance = Math.abs(itemCenter - centerY);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
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
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const options = useMemo(() => buildPickerRange(min, max, step), [min, max, step]);
  const decimalPlaces = getDecimalPlaces(step);

  const resolvedValue =
    value != null
      ? findClosestPickerValue(options, value)
      : defaultValue != null
        ? findClosestPickerValue(options, defaultValue)
        : options[Math.floor(options.length / 2)] ?? min;

  const selectedIndex = findOptionIndex(options, resolvedValue);

  const formatOption = (option: number) => {
    if (formatValue) return formatValue(option);
    const formatted = formatNumericValue(option, decimalPlaces > 0 ? decimalPlaces : undefined);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const scrollToSelectedIndex = (behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;

    syncingRef.current = true;
    container.scrollTo({ top: selectedIndex * itemHeight, behavior });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, behavior === 'smooth' ? 180 : 120);
  };

  useLayoutEffect(() => {
    scrollToSelectedIndex('auto');
  }, [selectedIndex, options.length]);

  useEffect(() => {
    if (!initializeOnMount || value != null || defaultValue == null || options.length === 0) {
      return;
    }

    onChangeRef.current(findClosestPickerValue(options, defaultValue));
  }, [initializeOnMount, value, defaultValue, options]);

  const markUserInteraction = () => {
    userInteractingRef.current = true;
  };

  const settleSelection = () => {
    const container = containerRef.current;
    if (!container || syncingRef.current || options.length === 0) return;

    if (!userInteractingRef.current) {
      scrollToSelectedIndex('auto');
      return;
    }

    const index = getCenteredOptionIndex(container, itemRefs.current);
    const next = options[index];

    if (index !== selectedIndex) {
      syncingRef.current = true;
      container.scrollTo({ top: index * itemHeight, behavior: 'auto' });
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 120);
    }

    userInteractingRef.current = false;
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
