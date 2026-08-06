import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import {
  buildMonthGrid,
  formatMonthLabel,
  getInitialCalendarMonth,
  getLocalDateKey,
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
}

export function HistoryDateCalendar({
  datesWithData,
  dateCounts,
  selectedDate,
  onSelect,
  locale,
  allowEmptySelect = true,
  onVisibleMonthChange,
}: HistoryDateCalendarProps) {
  const { t } = useTranslation('machines');
  const todayKey = getLocalDateKey(new Date().toISOString());
  const initialMonth = getInitialCalendarMonth(selectedDate, datesWithData);
  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(initialMonth.monthIndex);

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

  return (
    <div className="history-calendar" aria-label={t('history.filterByDate')}>
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

          return (
            <button
              key={`${cell.dateKey}-${cell.inCurrentMonth ? 'in' : 'out'}`}
              type="button"
              className={[
                'history-calendar__day',
                !cell.inCurrentMonth && 'history-calendar__day--outside',
                hasData ? 'history-calendar__day--has-data' : 'history-calendar__day--empty',
                allowEmptySelect && !hasData && 'history-calendar__day--selectable',
                isSelected && 'history-calendar__day--selected',
                isToday && 'history-calendar__day--today',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!canSelect}
              aria-pressed={isSelected}
              aria-label={cell.dateKey}
              onClick={() => onSelect(cell.dateKey)}
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
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="history-calendar__hint">{t('history.calendarHint')}</p>
    </div>
  );
}
