import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import {
  buildMonthGrid,
  formatMonthLabel,
  getInitialCalendarMonth,
  getTodayDateKey,
  getWeekdayLabels,
  parseDateKey,
  type MuscleGroupCount,
} from '@/utils/historyDate';

const MAX_CALENDAR_MUSCLE_LABELS = 4;

interface HistoryDateCalendarProps {
  datesWithData: Set<string>;
  /** Optional per-date counts (plans + records). Falls back to a dot when missing. */
  dateCounts?: Map<string, number>;
  /** Optional per-date muscle group + exercise counts shown under the day number. */
  dateMuscleCounts?: Map<string, MuscleGroupCount[]>;
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  locale: string;
  /** When true (default), empty days are selectable (e.g. future plan dates). */
  allowEmptySelect?: boolean;
  /**
   * When true (default: same as allowEmptySelect), show plan “+” on future empty days
   * and the plan legend. Set false for read-only workout calendars.
   */
  showPlanHints?: boolean;
  /** Fires when the visible month changes (for calendar-summary fetches). */
  onVisibleMonthChange?: (year: number, monthIndex: number) => void;
  /** Called after a day is chosen (e.g. close parent `<details>`). */
  onAfterSelect?: () => void;
  /** Sheet presentation for the records date-filter dialog. */
  presentation?: 'default' | 'sheet';
}

export function HistoryDateCalendar({
  datesWithData,
  dateCounts,
  dateMuscleCounts,
  selectedDate,
  onSelect,
  locale,
  allowEmptySelect = true,
  showPlanHints,
  onVisibleMonthChange,
  onAfterSelect,
  presentation = 'default',
}: HistoryDateCalendarProps) {
  const planHints = showPlanHints ?? allowEmptySelect;
  const { t } = useTranslation('machines');
  const todayKey = getTodayDateKey();
  const initialMonth = getInitialCalendarMonth(selectedDate, datesWithData);
  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(initialMonth.monthIndex);
  const [monthDir, setMonthDir] = useState<0 | -1 | 1>(0);

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

  const monthWorkoutDays = useMemo(() => {
    let n = 0;
    for (const cell of cells) {
      if (!cell.inCurrentMonth) continue;
      const count = dateCounts?.get(cell.dateKey) ?? 0;
      const muscles = dateMuscleCounts?.get(cell.dateKey)?.length ?? 0;
      if (datesWithData.has(cell.dateKey) || count > 0 || muscles > 0) n += 1;
    }
    return n;
  }, [cells, dateCounts, dateMuscleCounts, datesWithData]);

  const pickDate = (dateKey: string) => {
    onSelect(dateKey);
    onAfterSelect?.();
  };

  const shiftMonth = (delta: -1 | 1) => {
    const date = new Date(viewYear, viewMonthIndex + delta, 1);
    setMonthDir(delta);
    setViewYear(date.getFullYear());
    setViewMonthIndex(date.getMonth());
  };

  const goTodayMonth = () => {
    const parsed = parseDateKey(todayKey);
    setMonthDir(0);
    setViewYear(parsed.year);
    setViewMonthIndex(parsed.monthIndex);
    pickDate(todayKey);
  };

  const onTodayAlready =
    viewYear === parseDateKey(todayKey).year &&
    viewMonthIndex === parseDateKey(todayKey).monthIndex &&
    selectedDate === todayKey;

  return (
    <div
      className={[
        'history-calendar',
        dateMuscleCounts && 'history-calendar--muscle-summaries',
        presentation === 'sheet' && 'history-calendar--sheet',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={t('history.filterByDate')}
    >
      <div className="history-calendar__toolbar">
        <div className="history-calendar__header">
          <button
            type="button"
            className="history-calendar__nav"
            onClick={() => shiftMonth(-1)}
            aria-label={t('history.prevMonth')}
          >
            <Icon
              name="chevronRight"
              size={18}
              className="history-calendar__nav-icon history-calendar__nav-icon--prev"
            />
          </button>
          <div className="history-calendar__month-wrap">
            <span
              key={`${viewYear}-${viewMonthIndex}`}
              className={[
                'history-calendar__month',
                monthDir === -1 && 'history-calendar__month--from-left',
                monthDir === 1 && 'history-calendar__month--from-right',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {formatMonthLabel(viewYear, viewMonthIndex, locale)}
            </span>
            {dateMuscleCounts ? (
              <span className="history-calendar__month-meta">
                {t('history.calendarMonthWorkoutDays', {
                  count: monthWorkoutDays,
                  defaultValue: `${monthWorkoutDays}일 운동`,
                })}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className={[
              'history-calendar__chip history-calendar__chip--today',
              onTodayAlready && 'is-active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={goTodayMonth}
            aria-current={onTodayAlready ? 'date' : undefined}
          >
            {t('history.goToday')}
          </button>
          <button
            type="button"
            className="history-calendar__nav"
            onClick={() => shiftMonth(1)}
            aria-label={t('history.nextMonth')}
          >
            <Icon name="chevronRight" size={18} className="history-calendar__nav-icon" />
          </button>
        </div>
      </div>

      <div className="history-calendar__weekdays">
        {weekdayLabels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className={[
              'history-calendar__weekday',
              (index === 0 || index === 6) && 'history-calendar__weekday--weekend',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </span>
        ))}
      </div>

      <div
        key={`${viewYear}-${viewMonthIndex}`}
        className={[
          'history-calendar__grid',
          monthDir === -1 && 'history-calendar__grid--from-left',
          monthDir === 1 && 'history-calendar__grid--from-right',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {cells.map((cell) => {
          const count = dateCounts?.get(cell.dateKey) ?? 0;
          const muscleRows = dateMuscleCounts?.get(cell.dateKey) ?? [];
          const hasMuscles = muscleRows.length > 0;
          const hasData = datesWithData.has(cell.dateKey) || count > 0 || hasMuscles;
          const isSelected = selectedDate === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          const canSelect = hasData || allowEmptySelect;
          const isFutureEmpty = planHints && allowEmptySelect && !hasData && cell.dateKey > todayKey;
          const parsed = parseDateKey(cell.dateKey);
          const isWeekend = new Date(parsed.year, parsed.monthIndex, cell.day).getDay() % 6 === 0;
          const visibleMuscles = muscleRows.slice(0, MAX_CALENDAR_MUSCLE_LABELS);
          const hiddenMuscleCount = Math.max(0, muscleRows.length - visibleMuscles.length);
          const muscleAria = hasMuscles
            ? muscleRows
                .map(
                  (row) =>
                    `${t(`muscleGroups.${row.group}`, { defaultValue: row.group })} ${row.count}`
                )
                .join(', ')
            : '';

          return (
            <button
              key={`${cell.dateKey}-${cell.inCurrentMonth ? 'in' : 'out'}`}
              type="button"
              className={[
                'history-calendar__day',
                hasMuscles && 'history-calendar__day--with-muscles',
                !cell.inCurrentMonth && 'history-calendar__day--outside',
                hasData ? 'history-calendar__day--has-data' : 'history-calendar__day--empty',
                allowEmptySelect && !hasData && 'history-calendar__day--selectable',
                isFutureEmpty && 'history-calendar__day--future',
                isSelected && 'history-calendar__day--selected',
                isToday && 'history-calendar__day--today',
                isWeekend && 'history-calendar__day--weekend',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!canSelect}
              aria-pressed={isSelected}
              aria-label={muscleAria ? `${cell.dateKey}, ${muscleAria}` : cell.dateKey}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canSelect) return;
                pickDate(cell.dateKey);
              }}
            >
              <span className="history-calendar__day-head">
                <span className="history-calendar__day-num">{cell.day}</span>
                {hasMuscles && count > 0 ? (
                  <span className="history-calendar__day-total" aria-hidden>
                    {count > 9 ? '9+' : count}
                  </span>
                ) : null}
              </span>
              {hasMuscles ? (
                <span className="history-calendar__day-muscles" aria-hidden>
                  {visibleMuscles.map((row) => {
                    const label = t(`muscleGroups.${row.group}`, { defaultValue: row.group });
                    return (
                      <span key={row.group} className="history-calendar__day-muscle">
                        <span className="history-calendar__day-muscle-name">{label}</span>
                        <span className="history-calendar__day-muscle-count">{row.count}</span>
                      </span>
                    );
                  })}
                  {hiddenMuscleCount > 0 ? (
                    <span className="history-calendar__day-muscle history-calendar__day-muscle--more">
                      +{hiddenMuscleCount}
                    </span>
                  ) : null}
                </span>
              ) : hasData ? (
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
              ) : (
                <span className="history-calendar__day-marker-slot" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="history-calendar__legend" aria-hidden>
        <span className="history-calendar__legend-item">
          <span className="history-calendar__legend-swatch history-calendar__legend-swatch--today" />
          {t('history.calendarLegendToday')}
        </span>
        <span className="history-calendar__legend-item">
          <span className="history-calendar__legend-swatch history-calendar__legend-swatch--data" />
          {t('history.calendarLegendHasData')}
        </span>
        {planHints ? (
          <span className="history-calendar__legend-item">
            <span className="history-calendar__legend-swatch history-calendar__legend-swatch--plan" />
            {t('history.calendarLegendPlan')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
