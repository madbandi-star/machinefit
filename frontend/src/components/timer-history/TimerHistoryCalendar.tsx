import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import {
  buildMonthGrid,
  formatMonthLabel,
  getTodayDateKey,
  parseDateKey,
} from '@/utils/historyDate';
import '@/styles/timer-history.css';

interface TimerHistoryCalendarProps {
  datesWithData: Set<string>;
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale: string;
  year: number;
  monthIndex: number;
  onMonthChange: (year: number, monthIndex: number) => void;
  loading?: boolean;
}

export function TimerHistoryCalendar({
  datesWithData,
  selectedDate,
  onSelect,
  locale,
  year,
  monthIndex,
  onMonthChange,
  loading = false,
}: TimerHistoryCalendarProps) {
  const { t } = useTranslation('common');
  const todayKey = getTodayDateKey();
  const [monthDir, setMonthDir] = useState<0 | -1 | 1>(0);

  useEffect(() => {
    if (!selectedDate) return;
    const parsed = parseDateKey(selectedDate);
    if (parsed.year !== year || parsed.monthIndex !== monthIndex) {
      onMonthChange(parsed.year, parsed.monthIndex);
    }
  }, [selectedDate, year, monthIndex, onMonthChange]);

  const cells = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, index) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + index)
        .toLocaleDateString(locale, { weekday: 'short' })
        .replace(/[().]/g, '')
        .trim()
    );
  }, [locale]);
  const monthLabel = formatMonthLabel(year, monthIndex, locale);

  const shiftMonth = (delta: number) => {
    setMonthDir(delta < 0 ? -1 : 1);
    const date = new Date(year, monthIndex + delta, 1);
    onMonthChange(date.getFullYear(), date.getMonth());
  };

  const goToday = () => {
    const today = parseDateKey(todayKey);
    onMonthChange(today.year, today.monthIndex);
    onSelect(todayKey);
  };

  return (
    <div
      className={`timer-cal${loading ? ' is-loading' : ''}`}
      aria-label={t('timerHistory.calendarLabel')}
    >
      <div className="timer-cal__toolbar">
        <div className="timer-cal__header">
          <button
            type="button"
            className="timer-cal__nav"
            onClick={() => shiftMonth(-1)}
            aria-label={t('timerHistory.prevMonth')}
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <p className="timer-cal__month">{monthLabel}</p>
          <button
            type="button"
            className="timer-cal__nav"
            onClick={() => shiftMonth(1)}
            aria-label={t('timerHistory.nextMonth')}
          >
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
        <button type="button" className="timer-cal__today" onClick={goToday}>
          {t('timerHistory.goToday')}
        </button>
      </div>

      <div className="timer-cal__weekdays">
        {weekdayLabels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className={`timer-cal__weekday${index === 0 || index === 6 ? ' is-weekend' : ''}`}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        className={[
          'timer-cal__grid',
          monthDir === -1 && 'timer-cal__grid--from-left',
          monthDir === 1 && 'timer-cal__grid--from-right',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {cells.map((cell) => {
          const hasData = datesWithData.has(cell.dateKey);
          const selected = selectedDate === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          return (
            <button
              key={cell.dateKey}
              type="button"
              className={[
                'timer-cal__day',
                !cell.inCurrentMonth && 'is-outside',
                hasData && 'has-data',
                selected && 'is-selected',
                isToday && 'is-today',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(cell.dateKey)}
              aria-label={
                hasData
                  ? t('timerHistory.dayWithDataAria', { date: cell.dateKey })
                  : cell.dateKey
              }
              aria-pressed={selected}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className="timer-cal__num">{cell.day}</span>
              {hasData ? (
                <span className="timer-cal__dot" aria-hidden="true" />
              ) : (
                <span className="timer-cal__dot-slot" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
