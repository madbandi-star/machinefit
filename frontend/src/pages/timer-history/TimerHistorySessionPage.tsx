import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { timerHistoryApi } from '@/api/timer-history.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import { formatClock, formatDurationSeconds } from '@/utils/timerHistoryFormat';
import '@/styles/components.css';
import '@/styles/timer-history.css';

export function TimerHistorySessionPage() {
  const { t, i18n } = useTranslation('common');
  const { sessionId = '' } = useParams();

  const query = useQuery({
    queryKey: QUERY_KEYS.timerHistorySession(sessionId),
    queryFn: async () => (await timerHistoryApi.session(sessionId)).data.data,
    enabled: Boolean(sessionId),
  });

  if (query.isLoading) {
    return (
      <PageShell title={t('timerHistory.sessionTitle')}>
        <Skeleton count={4} height={72} />
      </PageShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageShell title={t('timerHistory.sessionTitle')}>
        <div className="timer-history-error">
          <p>{t('timerHistory.loadFailed')}</p>
          <button type="button" className="btn btn--secondary" onClick={() => void query.refetch()}>
            {t('actions.retry')}
          </button>
          <Link to={ROUTES.TIMER_HISTORY}>{t('timerHistory.backToCalendar')}</Link>
        </div>
      </PageShell>
    );
  }

  const session = query.data;
  const dateKey = session.sessionDate;

  return (
    <PageShell
      title={t('timerHistory.sessionTitle')}
      subtitle={`${formatHistoryDateHeader(dateKey, i18n.language)} · ${formatClock(session.startedAt, i18n.language)} ~ ${formatClock(session.endedAt, i18n.language)}`}
    >
      <div className="timer-history-page">
        <p className="timer-history-summary">
          {t('timerHistory.totalDuration')} {formatDurationSeconds(session.durationSeconds, t)}
          {' · '}
          {t('timerHistory.lapCountLabel', { count: session.lapCount })}
        </p>

        <ol className="timer-lap-list">
          {session.laps.map((lap) => (
            <li key={lap.id} className="card timer-lap-card">
              <div className="timer-lap-card__head">
                <span className="timer-lap-card__index">
                  {t('timerHistory.lapItem', { n: lap.lapNumber })}
                </span>
                <span className="timer-lap-card__dur">
                  {formatDurationSeconds(lap.durationSeconds, t)}
                </span>
              </div>
              {lap.exercises.length === 0 ? (
                <p className="timer-history-empty">{t('timerHistory.noMachines')}</p>
              ) : (
                <>
                  {lap.exercises.length > 1 ? (
                    <p className="timer-lap-card__sets">
                      {t('timerHistory.machineCount', { count: lap.exercises.length })}
                    </p>
                  ) : null}
                  <ul className="timer-lap-card__machines">
                    {lap.exercises.map((ex) => (
                      <li key={ex.id}>
                        {ex.machineName || t('timerHistory.unknownMachine')}
                        {ex.setCount != null ? (
                          <span className="timer-lap-card__sets">
                            {' · '}
                            {t('timerHistory.setCount', { count: ex.setCount })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ol>

        <Link to={`${ROUTES.TIMER_HISTORY}?date=${encodeURIComponent(dateKey)}`}>
          {t('timerHistory.backToCalendar')}
        </Link>
      </div>
    </PageShell>
  );
}
