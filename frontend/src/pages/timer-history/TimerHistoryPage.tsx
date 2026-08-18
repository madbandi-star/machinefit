import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { TimerHistoryCalendar } from '@/components/timer-history/TimerHistoryCalendar';
import { timerHistoryApi } from '@/api/timer-history.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { formatHistoryDateHeader, getTodayDateKey, parseDateKey } from '@/utils/historyDate';
import { formatClock, formatDurationCompact } from '@/utils/timerHistoryFormat';
import { flushTimerHistoryQueue } from '@/utils/timerHistoryPersist';
import '@/styles/components.css';
import '@/styles/timer-history.css';

export function TimerHistoryPage() {
  const { t, i18n } = useTranslation('common');
  const [params, setParams] = useSearchParams();
  const todayKey = getTodayDateKey();
  const selectedDate = params.get('date') || todayKey;
  const parsed = parseDateKey(selectedDate);
  const [month, setMonth] = useState(() => ({
    year: parsed.year,
    monthIndex: parsed.monthIndex,
  }));

  useEffect(() => {
    void flushTimerHistoryQueue();
  }, []);

  const monthQuery = useQuery({
    queryKey: QUERY_KEYS.timerHistoryMonth(month.year, month.monthIndex + 1),
    queryFn: async () =>
      (await timerHistoryApi.month(month.year, month.monthIndex + 1)).data.data,
    staleTime: 30_000,
  });

  const dayQuery = useQuery({
    queryKey: QUERY_KEYS.timerHistoryDate(selectedDate),
    queryFn: async () => (await timerHistoryApi.date(selectedDate)).data.data,
    staleTime: 15_000,
  });

  const dayCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [key, value] of Object.entries(monthQuery.data?.days ?? {})) {
      map[key] = value.sessionCount;
    }
    return map;
  }, [monthQuery.data]);

  const handleSelect = useCallback(
    (dateKey: string) => {
      setParams({ date: dateKey }, { replace: true });
    },
    [setParams]
  );

  const handleMonthChange = useCallback((year: number, monthIndex: number) => {
    setMonth((prev) =>
      prev.year === year && prev.monthIndex === monthIndex ? prev : { year, monthIndex }
    );
  }, []);

  const day = dayQuery.data;
  const hasSessions = (day?.sessions.length ?? 0) > 0;

  return (
    <div className="timer-history-page">
      <PageShell title={t('timerHistory.title')}>
        {monthQuery.isLoading ? (
          <Skeleton height={220} />
        ) : monthQuery.isError ? (
          <div className="timer-history-error">
            <p>{t('timerHistory.loadFailed')}</p>
            <button type="button" className="btn btn--secondary" onClick={() => void monthQuery.refetch()}>
              {t('actions.retry')}
            </button>
          </div>
        ) : (
          <TimerHistoryCalendar
            dayCounts={dayCounts}
            selectedDate={selectedDate}
            onSelect={handleSelect}
            locale={i18n.language}
            year={month.year}
            monthIndex={month.monthIndex}
            onMonthChange={handleMonthChange}
            loading={monthQuery.isFetching}
          />
        )}

        <section className="timer-history-day" aria-live="polite">
          <header className="timer-history-day__head">
            <h2>{formatHistoryDateHeader(selectedDate, i18n.language)}</h2>
          </header>
          {dayQuery.isLoading ? (
            <Skeleton count={2} height={64} />
          ) : dayQuery.isError ? (
            <div className="timer-history-error">
              <p>{t('timerHistory.loadFailed')}</p>
              <button type="button" className="btn btn--secondary" onClick={() => void dayQuery.refetch()}>
                {t('actions.retry')}
              </button>
            </div>
          ) : !hasSessions ? (
            <div className="card timer-history-empty-card">
              <p>{t('timerHistory.emptyDay')}</p>
              <p>{t('timerHistory.emptyHint')}</p>
              <Link to={ROUTES.HOME} className="btn btn--secondary">
                {t('timerHistory.openTimer')}
              </Link>
            </div>
          ) : (
            <>
              <div className="timer-history-stats">
                <span>
                  <strong>{formatDurationCompact(day?.totalDurationSeconds ?? 0, t)}</strong>
                  {t('timerHistory.totalDuration')}
                </span>
                <span>
                  <strong>{day?.sessionCount ?? 0}</strong>
                  {t('timerHistory.statSessions')}
                </span>
                <span>
                  <strong>{day?.lapCount ?? 0}</strong>
                  {t('timerHistory.statLaps')}
                </span>
              </div>
              <div className="timer-history-sessions">
                {(day?.sessions ?? []).map((session) => (
                  <Link
                    key={session.id}
                    className="card card--interactive timer-session-card"
                    to={ROUTES.TIMER_HISTORY_SESSION.replace(':sessionId', session.id)}
                    aria-label={t('timerHistory.sessionCardAria', {
                      start: formatClock(session.startedAt, i18n.language),
                      end: formatClock(session.endedAt, i18n.language),
                    })}
                  >
                    <div className="timer-session-card__when">
                      <span className="timer-session-card__time">
                        {formatClock(session.startedAt, i18n.language)}
                        {' – '}
                        {formatClock(session.endedAt, i18n.language)}
                      </span>
                      <span>{t('timerHistory.lapCountLabel', { count: session.lapCount })}</span>
                    </div>
                    <strong className="timer-session-card__dur">
                      {formatDurationCompact(session.durationSeconds, t)}
                    </strong>
                    <Icon name="chevronRight" size={18} className="timer-session-card__chevron" aria-hidden />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </PageShell>
    </div>
  );
}
