import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { timerHistoryApi } from '@/api/timer-history.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import { formatClock, formatDurationCompact } from '@/utils/timerHistoryFormat';
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
      <div className="timer-history-page timer-history-page--session">
        <PageShell title={t('timerHistory.sessionTitle')}>
          <Skeleton count={4} height={72} />
        </PageShell>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="timer-history-page timer-history-page--session">
        <PageShell title={t('timerHistory.sessionTitle')}>
          <div className="timer-history-error">
            <p>{t('timerHistory.loadFailed')}</p>
            <button type="button" className="btn btn--secondary" onClick={() => void query.refetch()}>
              {t('actions.retry')}
            </button>
            <Link className="timer-history-back" to={ROUTES.TIMER_HISTORY}>
              {t('timerHistory.backToCalendar')}
            </Link>
          </div>
        </PageShell>
      </div>
    );
  }

  const session = query.data;
  const dateKey = session.sessionDate;
  const calendarTo = `${ROUTES.TIMER_HISTORY}?date=${encodeURIComponent(dateKey)}`;

  return (
    <div className="timer-history-page timer-history-page--session">
      <PageShell>
        <nav className="timer-history-nav">
          <Link to={calendarTo} className="timer-history-back">
            {t('timerHistory.backToCalendar')}
          </Link>
          <h1>{t('timerHistory.sessionTitle')}</h1>
        </nav>

        <p className="timer-history-session__when">
          {formatHistoryDateHeader(dateKey, i18n.language)}
          {' · '}
          {formatClock(session.startedAt, i18n.language)}
          {' – '}
          {formatClock(session.endedAt, i18n.language)}
        </p>

        <div className="timer-history-stats">
          <span>
            <strong>{formatDurationCompact(session.durationSeconds, t)}</strong>
            {t('timerHistory.totalDuration')}
          </span>
          <span>
            <strong>{session.lapCount}</strong>
            {t('timerHistory.statLaps')}
          </span>
        </div>

        <ol className="timer-lap-list">
          {session.laps.map((lap) => (
            <li key={lap.id} className="card timer-lap-card">
              <div className="timer-lap-card__head">
                <div>
                  <span className="timer-lap-card__index">
                    {t('timerHistory.lapItem', { n: lap.lapNumber })}
                  </span>
                  <span className="timer-lap-card__range">
                    {formatClock(lap.startedAt, i18n.language)}
                    {' – '}
                    {formatClock(lap.endedAt, i18n.language)}
                  </span>
                </div>
                <span className="timer-lap-card__dur">
                  {formatDurationCompact(lap.durationSeconds, t)}
                </span>
              </div>
              {lap.exercises.length === 0 ? (
                <p className="timer-lap-card__empty">{t('timerHistory.noMachines')}</p>
              ) : (
                <ul className="timer-lap-card__machines">
                  {lap.exercises.map((ex) => {
                    const name = ex.machineName || t('timerHistory.unknownMachine');
                    const chip = (
                      <>
                        <span>{name}</span>
                        {ex.setCount != null ? (
                          <em>{t('timerHistory.setCount', { count: ex.setCount })}</em>
                        ) : null}
                      </>
                    );
                    return (
                      <li key={ex.id}>
                        {ex.machineCode ? (
                          <Link
                            className="timer-lap-chip"
                            to={ROUTES.MACHINE_DETAIL.replace(':machineCode', ex.machineCode)}
                          >
                            {chip}
                          </Link>
                        ) : (
                          <span className="timer-lap-chip">{chip}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </PageShell>
    </div>
  );
}
