import { useEffect, useMemo, useRef } from 'react';
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
  const syncingRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);

  const options = useMemo(() => buildPickerRange(min, max, step), [min, max, step]);
  const decimalPlaces = getDecimalPlaces(step);

  const resolvedValue =
    value != null
      ? findClosestPickerValue(options, value)
      : defaultValue != null
        ? findClosestPickerValue(options, defaultValue)
        : options[Math.floor(options.length / 2)] ?? min;

  const selectedIndex = Math.max(0, options.indexOf(resolvedValue));

  const formatOption = (option: number) => {
    if (formatValue) return formatValue(option);
    const formatted = formatNumericValue(option, decimalPlaces > 0 ? decimalPlaces : undefined);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    const container = containerRef.current;
    if (!container) return;

    syncingRef.current = true;
    container.scrollTo({ top: index * itemHeight, behavior });
    window.setTimeout(() => {
      syncingRef.current = false;
    }, behavior === 'smooth' ? 180 : 0);
  };

  useEffect(() => {
    scrollToIndex(selectedIndex);
  }, [selectedIndex, options.length]);

  useEffect(() => {
    if (!initializeOnMount || value != null || defaultValue == null || options.length === 0) {
      return;
    }

    onChange(findClosestPickerValue(options, defaultValue));
  }, [initializeOnMount, value, defaultValue, options, onChange]);

  const settleSelection = () => {
    const container = containerRef.current;
    if (!container || syncingRef.current || options.length === 0) return;

    const rawIndex = Math.round(container.scrollTop / itemHeight);
    const index = Math.max(0, Math.min(options.length - 1, rawIndex));
    const next = options[index];

    if (container.scrollTop !== index * itemHeight) {
      scrollToIndex(index);
    }

    if (value !== next) {
      onChange(next);
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
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`scroll-picker__item${isSelected ? ' scroll-picker__item--selected' : ''}`}
                style={{ height: itemHeight }}
                onClick={() => {
                  scrollToIndex(index, 'smooth');
                  onChange(option);
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
