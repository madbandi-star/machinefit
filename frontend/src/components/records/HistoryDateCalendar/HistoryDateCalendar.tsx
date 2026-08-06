import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import {
  buildMonthGrid,
  formatMonthLabel,
  getInitialCalendarMonth,
  getTodayDateKey,
  getWeekdayLabels,
  parseDateKey,
} from '@/utils/historyDate';

interface HistoryDateCalendarProps {
  datesWithData: Set<string>;
  /** Optional per-date counts (plans + records). Falls back to a dot when missing. */
  dateCounts?: Map<string, number>;
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale: string;
  /** When true (default), empty days are selectable (e.g. future plan dates). */
  allowEmptySelect?: boolean;
  /** Fires when the visible month changes (for calendar-summary fetches). */
  onVisibleMonthChange?: (year: number, monthIndex: number) => void;
  /** Called after a day is chosen (e.g. close parent `<details>`). */
  onAfterSelect?: () => void;
}

export function HistoryDateCalendar({
  datesWithData,
  dateCounts,
  selectedDate,
  onSelect,
  locale,
  allowEmptySelect = true,
  onVisibleMonthChange,
  onAfterSelect,
}: HistoryDateCalendarProps) {
  const { t } = useTranslation('machines');
  const todayKey = getTodayDateKey();
  const initialMonth = getInitialCalendarMonth(selectedDate, datesWithData);
  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(initialMonth.monthIndex);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedDate) return;
    const parsed = parseDateKey(selectedDate);
    setViewYear(parsed.year);
    setViewMonthIndex(parsed.monthIndex);
  }, [selectedDate]);

  useEffect(() => {
    onVisibleMonthChange?.(viewYear, viewMonthIndex);
  }, [viewYear, viewMonthIndex, onVisibleMonthChange]);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonthIndex),
    [viewYear, viewMonthIndex]
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonthIndex + delta, 1);
    setViewYear(date.getFullYear());
    setViewMonthIndex(date.getMonth());
  };

  const pickDate = (dateKey: string) => {
    onSelect(dateKey);
    onAfterSelect?.();
  };

  return (
    <div className="history-calendar" aria-label={t('history.filterByDate')}>
      {allowEmptySelect ? (
        <div className="history-calendar__date-field">
          <label className="history-calendar__date-field-label" htmlFor="history-plan-date-input">
            {t('history.planPickAnyDate')}
          </label>
          <input
            ref={dateInputRef}
            id="history-plan-date-input"
            type="date"
            className="history-calendar__date-input"
            value={selectedDate || todayKey}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                pickDate(value);
              }
            }}
          />
        </div>
      ) : null}

      <div className="history-calendar__header">
        <button
          type="button"
          className="history-calendar__nav"
          onClick={() => shiftMonth(-1)}
          aria-label={t('history.prevMonth')}
        >
          <Icon name="chevronRight" size={16} className="history-calendar__nav-icon history-calendar__nav-icon--prev" />
        </button>
        <span className="history-calendar__month">{formatMonthLabel(viewYear, viewMonthIndex, locale)}</span>
        <button
          type="button"
          className="history-calendar__nav"
          onClick={() => shiftMonth(1)}
          aria-label={t('history.nextMonth')}
        >
          <Icon name="chevronRight" size={16} className="history-calendar__nav-icon" />
        </button>
      </div>

      <div className="history-calendar__weekdays">
        {weekdayLabels.map((label) => (
          <span key={label} className="history-calendar__weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="history-calendar__grid">
        {cells.map((cell) => {
          const count = dateCounts?.get(cell.dateKey) ?? 0;
          const hasData = datesWithData.has(cell.dateKey) || count > 0;
          const isSelected = selectedDate === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          const canSelect = hasData || allowEmptySelect;
          const isFutureEmpty = allowEmptySelect && !hasData && cell.dateKey > todayKey;

          return (
            <button
              key={`${cell.dateKey}-${cell.inCurrentMonth ? 'in' : 'out'}`}
              type="button"
              className={[
                'history-calendar__day',
                !cell.inCurrentMonth && 'history-calendar__day--outside',
                hasData ? 'history-calendar__day--has-data' : 'history-calendar__day--empty',
                allowEmptySelect && !hasData && 'history-calendar__day--selectable',
                isFutureEmpty && 'history-calendar__day--future',
                isSelected && 'history-calendar__day--selected',
                isToday && 'history-calendar__day--today',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!canSelect}
              aria-pressed={isSelected}
              aria-label={cell.dateKey}
              onPointerDown={(e) => {
                // Keep parent <details> from swallowing the first tap on mobile.
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canSelect) return;
                pickDate(cell.dateKey);
              }}
            >
              <span className="history-calendar__day-num">{cell.day}</span>
              {hasData ? (
                count > 1 ? (
                  <span className="history-calendar__day-count" aria-hidden>
                    {count > 9 ? '9+' : count}
                  </span>
                ) : (
                  <span className="history-calendar__day-dot" aria-hidden />
                )
              ) : isFutureEmpty ? (
                <span className="history-calendar__day-plus" aria-hidden>
                  +
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="history-calendar__hint">
        {allowEmptySelect ? t('history.calendarHintPlan') : t('history.calendarHint')}
      </p>
    </div>
  );
}
