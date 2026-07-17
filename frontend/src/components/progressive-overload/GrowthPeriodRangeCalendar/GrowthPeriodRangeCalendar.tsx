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

interface GrowthPeriodRangeCalendarProps {
  datesWithData: Set<string>;
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
  locale: string;
}

function isDateInRange(dateKey: string, from: string, to: string): boolean {
  if (!from || !to) return false;
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  return dateKey >= start && dateKey <= end;
}

export function GrowthPeriodRangeCalendar({
  datesWithData,
  from,
  to,
  onRangeChange,
  locale,
}: GrowthPeriodRangeCalendarProps) {
  const { t } = useTranslation('common');
  const todayKey = getLocalDateKey(new Date().toISOString());
  const anchorDate = from || to;
  const initialMonth = getInitialCalendarMonth(anchorDate, datesWithData);
  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(initialMonth.monthIndex);
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  useEffect(() => {
    if (!anchorDate) return;
    const parsed = parseDateKey(anchorDate);
    setViewYear(parsed.year);
    setViewMonthIndex(parsed.monthIndex);
  }, [anchorDate]);

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

  const handleDayClick = (dateKey: string) => {
    if (pendingFrom) {
      const start = dateKey < pendingFrom ? dateKey : pendingFrom;
      const end = dateKey < pendingFrom ? pendingFrom : dateKey;
      onRangeChange(start, end);
      setPendingFrom(null);
      return;
    }

    if (from && to) {
      setPendingFrom(dateKey);
      onRangeChange(dateKey, '');
      return;
    }

    if (from && !to) {
      const start = dateKey < from ? dateKey : from;
      const end = dateKey < from ? from : dateKey;
      onRangeChange(start, end);
      return;
    }

    setPendingFrom(dateKey);
    onRangeChange(dateKey, '');
  };

  const rangeStart = from && to ? (from <= to ? from : to) : from || pendingFrom || '';
  const rangeEnd = from && to ? (from <= to ? to : from) : '';

  return (
    <div className="history-calendar growth-period-range-calendar" aria-label={t('growthAnalysis.periodRange.calendarLabel')}>
      <div className="history-calendar__header">
        <button
          type="button"
          className="history-calendar__nav"
          onClick={() => shiftMonth(-1)}
          aria-label={t('growthAnalysis.periodRange.prevMonth')}
        >
          <Icon name="chevronRight" size={16} className="history-calendar__nav-icon history-calendar__nav-icon--prev" />
        </button>
        <span className="history-calendar__month">{formatMonthLabel(viewYear, viewMonthIndex, locale)}</span>
        <button
          type="button"
          className="history-calendar__nav"
          onClick={() => shiftMonth(1)}
          aria-label={t('growthAnalysis.periodRange.nextMonth')}
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
          const hasData = datesWithData.has(cell.dateKey);
          const inRange =
            rangeEnd !== ''
              ? isDateInRange(cell.dateKey, rangeStart, rangeEnd)
              : cell.dateKey === rangeStart;
          const isRangeStart = rangeStart !== '' && cell.dateKey === rangeStart;
          const isRangeEnd = rangeEnd !== '' && cell.dateKey === rangeEnd;
          const isToday = cell.dateKey === todayKey;

          return (
            <button
              key={`${cell.dateKey}-${cell.inCurrentMonth ? 'in' : 'out'}`}
              type="button"
              className={[
                'history-calendar__day',
                !cell.inCurrentMonth && 'history-calendar__day--outside',
                hasData ? 'history-calendar__day--has-data' : 'history-calendar__day--selectable',
                inRange && 'history-calendar__day--in-range',
                isRangeStart && 'history-calendar__day--range-start',
                isRangeEnd && 'history-calendar__day--range-end',
                isToday && 'history-calendar__day--today',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={inRange}
              aria-label={cell.dateKey}
              onClick={() => handleDayClick(cell.dateKey)}
            >
              <span className="history-calendar__day-num">{cell.day}</span>
              {hasData ? <span className="history-calendar__day-dot" aria-hidden /> : null}
            </button>
          );
        })}
      </div>

      <p className="history-calendar__hint">{t('growthAnalysis.periodRange.calendarHint')}</p>
    </div>
  );
}
