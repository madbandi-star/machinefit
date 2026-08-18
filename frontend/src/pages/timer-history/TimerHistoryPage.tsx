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
import { formatClock, formatDurationSeconds } from '@/utils/timerHistoryFormat';
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

  const datesWithData = useMemo(() => {
    return new Set(Object.keys(monthQuery.data?.days ?? {}));
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
    <PageShell title={t('timerHistory.title')} subtitle={t('timerHistory.subtitle')}>
      <div className="timer-history-page">
        {monthQuery.isLoading ? (
          <Skeleton height={280} />
        ) : monthQuery.isError ? (
          <div className="timer-history-error">
            <p>{t('timerHistory.loadFailed')}</p>
            <button type="button" className="btn btn--secondary" onClick={() => void monthQuery.refetch()}>
              {t('actions.retry')}
            </button>
          </div>
        ) : (
          <TimerHistoryCalendar
            datesWithData={datesWithData}
            selectedDate={selectedDate}
            onSelect={handleSelect}
            locale={i18n.language}
            year={month.year}
            monthIndex={month.monthIndex}
            onMonthChange={handleMonthChange}
            loading={monthQuery.isFetching}
          />
        )}

        <section className="timer-history-summary" aria-live="polite">
          <h2>{formatHistoryDateHeader(selectedDate, i18n.language)}</h2>
          {dayQuery.isLoading ? (
            <Skeleton count={2} height={72} />
          ) : dayQuery.isError ? (
            <div className="timer-history-error">
              <p>{t('timerHistory.loadFailed')}</p>
              <button type="button" className="btn btn--secondary" onClick={() => void dayQuery.refetch()}>
                {t('actions.retry')}
              </button>
            </div>
          ) : !hasSessions ? (
            <p className="timer-history-empty">{t('timerHistory.emptyDay')}</p>
          ) : (
            <>
              <p>
                {t('timerHistory.dayMeta', {
                  duration: formatDurationSeconds(day?.totalDurationSeconds ?? 0, t),
                  sessions: day?.sessionCount ?? 0,
                  laps: day?.lapCount ?? 0,
                })}
              </p>
              <div className="timer-history-page">
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
                    <div className="timer-session-card__meta">
                      <span className="timer-session-card__time">
                        {formatClock(session.startedAt, i18n.language)}
                        {' ~ '}
                        {formatClock(session.endedAt, i18n.language)}
                      </span>
                      <span className="timer-session-card__stats">
                        <span>
                          {t('timerHistory.totalDuration')}{' '}
                          {formatDurationSeconds(session.durationSeconds, t)}
                        </span>
                        <span>{t('timerHistory.lapCountLabel', { count: session.lapCount })}</span>
                      </span>
                    </div>
                    <Icon name="chevronRight" size={18} className="timer-session-card__chevron" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
