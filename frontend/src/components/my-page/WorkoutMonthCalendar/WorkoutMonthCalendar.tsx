import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { HistoryDateCalendar } from '@/components/records/HistoryDateCalendar/HistoryDateCalendar';
import { Icon } from '@/components/icons/Icon';
import { fetchWorkoutLogs } from '@/api/workout-log';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { extractWorkoutLogDateKeys } from '@/utils/workoutAnalytics';
import { formatMonthLabel } from '@/utils/historyDate';
import '@/styles/records.css';
import '@/styles/components.css';

function monthRange(year: number, monthIndex: number): { from: string; to: string } {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const mm = String(monthIndex + 1).padStart(2, '0');
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * Monthly workout calendar for My Page.
 * Marks days that have existing workout logs; does not invent duration or alter save logic.
 * Collapsed by default to keep the profile above the fold uncluttered.
 */
export function WorkoutMonthCalendar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();

  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });

  const range = useMemo(
    () => monthRange(visibleMonth.year, visibleMonth.monthIndex),
    [visibleMonth.year, visibleMonth.monthIndex]
  );

  const memberKey = activeMemberId ?? '';
  const canFetch =
    Boolean(user) && Boolean(activeGymId) && memberScopeReady && Boolean(activeMemberId);

  const { data: logs = [], isFetching } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsList(activeGymId ?? '', memberKey, {
      from: range.from,
      to: range.to,
    }),
    queryFn: () =>
      fetchWorkoutLogs({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        from: range.from,
        to: range.to,
      }),
    enabled: canFetch && expanded,
    staleTime: 30_000,
  });

  const datesWithData = useMemo(() => extractWorkoutLogDateKeys(logs), [logs]);

  const workoutDaysCount = useMemo(() => {
    let count = 0;
    for (const key of datesWithData) {
      if (key >= range.from && key <= range.to) count += 1;
    }
    return count;
  }, [datesWithData, range.from, range.to]);

  const monthLabel = formatMonthLabel(visibleMonth.year, visibleMonth.monthIndex, i18n.language);

  const handleVisibleMonthChange = useCallback((year: number, monthIndex: number) => {
    setVisibleMonth((prev) =>
      prev.year === year && prev.monthIndex === monthIndex ? prev : { year, monthIndex }
    );
  }, []);

  const handleSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
    if (datesWithData.has(dateKey)) {
      navigate(`${ROUTES.RECORDS}?tab=history&date=${encodeURIComponent(dateKey)}`);
    }
  };

  const showEmptyMessage = Boolean(selectedDate) && !datesWithData.has(selectedDate);

  return (
    <section
      className={`my-page-section mypage-workout-calendar my-page-section--collapsible${
        expanded ? ' my-page-section--expanded' : ''
      }`}
    >
      <button
        type="button"
        className="my-page-section__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls="mypage-workout-calendar-body"
      >
        <h3 id="mypage-workout-calendar-title" className="my-page-section__title">
          {t('myPage.workoutCalendar')}
        </h3>
        <Icon
          name="chevronDown"
          size={18}
          className={`my-page-section__chevron${expanded ? ' my-page-section__chevron--open' : ''}`}
          aria-hidden
        />
        <span className="visually-hidden">{expanded ? t('collapse') : t('expand')}</span>
      </button>

      {expanded ? (
        <div id="mypage-workout-calendar-body">
          <p className="mypage-workout-calendar__desc">{t('myPage.workoutCalendarDesc')}</p>

          {!canFetch ? (
            <p className="mypage-workout-calendar__hint">{t('myPage.workoutCalendarNeedGym')}</p>
          ) : (
            <p className="mypage-workout-calendar__summary">
              {t('myPage.workoutCalendarDays', { month: monthLabel, count: workoutDaysCount })}
            </p>
          )}

          <div
            className={[
              'mypage-workout-calendar__panel',
              isFetching && 'mypage-workout-calendar__panel--loading',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <HistoryDateCalendar
              datesWithData={datesWithData}
              selectedDate={selectedDate}
              onSelect={handleSelect}
              locale={i18n.language}
              allowEmptySelect
              showPlanHints={false}
              onVisibleMonthChange={handleVisibleMonthChange}
            />
          </div>

          {canFetch && showEmptyMessage ? (
            <p className="mypage-workout-calendar__empty" role="status">
              {t('myPage.workoutCalendarNoLogs')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
