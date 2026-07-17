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
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale: string;
}

export function HistoryDateCalendar({
  datesWithData,
  selectedDate,
  onSelect,
  locale,
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
          const hasData = datesWithData.has(cell.dateKey);
          const isSelected = selectedDate === cell.dateKey;
          const isToday = cell.dateKey === todayKey;

          return (
            <button
              key={`${cell.dateKey}-${cell.inCurrentMonth ? 'in' : 'out'}`}
              type="button"
              className={[
                'history-calendar__day',
                !cell.inCurrentMonth && 'history-calendar__day--outside',
                hasData ? 'history-calendar__day--has-data' : 'history-calendar__day--empty',
                isSelected && 'history-calendar__day--selected',
                isToday && 'history-calendar__day--today',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!hasData}
              aria-pressed={isSelected}
              aria-label={cell.dateKey}
              onClick={() => onSelect(cell.dateKey)}
            >
              <span className="history-calendar__day-num">{cell.day}</span>
              {hasData ? <span className="history-calendar__day-dot" aria-hidden /> : null}
            </button>
          );
        })}
      </div>

      <p className="history-calendar__hint">{t('history.calendarHint')}</p>
    </div>
  );
}
