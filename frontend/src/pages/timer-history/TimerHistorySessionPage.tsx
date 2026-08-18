import { Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { timerHistoryApi } from '@/api/timer-history.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import {
  formatClock,
  formatDurationCompact,
  formatSetWeightsKg,
  formatTimerClock,
} from '@/utils/timerHistoryFormat';
import type { TimerHistoryLapExercise, TimerHistorySessionDetail } from '@machinefit/shared';
import '@/styles/components.css';
import '@/styles/timer-history.css';

function uniqueMachineCount(session: TimerHistorySessionDetail): number {
  const keys = new Set<string>();
  for (const lap of session.laps) {
    for (const ex of lap.exercises) {
      keys.add(ex.machineCode || ex.machineId || ex.machineName || ex.id);
    }
  }
  return keys.size;
}

function ExerciseRow({ ex }: { ex: TimerHistoryLapExercise }) {
  const { t } = useTranslation('common');
  const name = ex.machineName || t('timerHistory.unknownMachine');
  const weights = formatSetWeightsKg(ex.setWeightsKg, t);
  const meta = [ex.setCount != null ? t('timerHistory.setCount', { count: ex.setCount }) : null, weights]
    .filter(Boolean)
    .join(' · ');
  const inner = (
    <>
      <span className="timer-ex-row__text">
        <span className="timer-ex-row__name">{name}</span>
        {meta ? <span className="timer-ex-row__meta">{meta}</span> : null}
      </span>
      {ex.machineCode ? (
        <Icon name="chevronRight" size={18} className="timer-ex-row__chevron" aria-hidden />
      ) : null}
    </>
  );

  if (ex.machineCode) {
    return (
      <Link
        className="timer-ex-row"
        to={ROUTES.MACHINE_DETAIL.replace(':machineCode', ex.machineCode)}
        aria-label={name}
      >
        {inner}
      </Link>
    );
  }

  return <div className="timer-ex-row is-static">{inner}</div>;
}

export function TimerHistorySessionPage() {
  const { t, i18n } = useTranslation('common');
  const { sessionId = '' } = useParams();

  const query = useQuery({
    queryKey: QUERY_KEYS.timerHistorySession(sessionId),
    queryFn: async () => (await timerHistoryApi.session(sessionId)).data.data,
    enabled: Boolean(sessionId),
  });

  const session = query.data;
  const dateKey = session?.sessionDate ?? '';
  const calendarTo = dateKey
    ? `${ROUTES.TIMER_HISTORY}?date=${encodeURIComponent(dateKey)}`
    : ROUTES.TIMER_HISTORY;
  const machineTotal = useMemo(() => (session ? uniqueMachineCount(session) : 0), [session]);

  if (query.isLoading) {
    return (
      <div className="timer-history-page timer-history-page--session">
        <PageShell>
          <Skeleton height={168} />
          <Skeleton count={3} height={88} />
        </PageShell>
      </div>
    );
  }

  if (query.isError || !session) {
    return (
      <div className="timer-history-page timer-history-page--session">
        <PageShell>
          <nav className="timer-history-nav">
            <Link to={ROUTES.TIMER_HISTORY} className="timer-history-back">
              <Icon name="chevronLeft" size={18} aria-hidden />
              {t('timerHistory.backToHistory')}
            </Link>
          </nav>
          <div className="timer-history-error">
            <p>{t('timerHistory.loadFailed')}</p>
            <button type="button" className="btn btn--secondary" onClick={() => void query.refetch()}>
              {t('actions.retry')}
            </button>
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="timer-history-page timer-history-page--session">
      <PageShell>
        <nav className="timer-history-nav">
          <Link to={calendarTo} className="timer-history-back">
            <Icon name="chevronLeft" size={18} aria-hidden />
            {t('timerHistory.backToHistory')}
          </Link>
        </nav>
        <h1 className="visually-hidden">{t('timerHistory.sessionTitle')}</h1>

        <section className="timer-session-hero" aria-label={t('timerHistory.sessionTitle')}>
          <p className="timer-session-hero__date">{formatHistoryDateHeader(dateKey, i18n.language)}</p>
          <p className="timer-session-hero__clock">{formatTimerClock(session.durationSeconds)}</p>
          <p className="timer-session-hero__label">{t('timerHistory.totalDuration')}</p>
          <p className="timer-session-hero__range">
            {formatClock(session.startedAt, i18n.language)}
            {' – '}
            {formatClock(session.endedAt, i18n.language)}
          </p>
          <div className="timer-session-hero__stats">
            <div className="timer-session-hero__stat">
              <strong>{session.lapCount}</strong>
              <span>{t('timerHistory.statLaps')}</span>
            </div>
            <div className="timer-session-hero__stat">
              <strong>{machineTotal}</strong>
              <span>{t('timerHistory.statMachines')}</span>
            </div>
          </div>
        </section>

        <section className="timer-session-laps" aria-label={t('timerHistory.lapsHeading')}>
          <h2>{t('timerHistory.lapsHeading')}</h2>
          {session.laps.length === 0 ? (
            <p className="timer-lap-card__empty">{t('timerHistory.noLaps')}</p>
          ) : (
            <ol className="timer-lap-list">
              {session.laps.map((lap) => (
                <li key={lap.id} className="timer-lap">
                  <div className="timer-lap__rail" aria-hidden>
                    <span className="timer-lap__badge">{lap.lapNumber}</span>
                  </div>
                  <div className="timer-lap__body">
                    <div className="timer-lap__head">
                      <div className="timer-lap__titles">
                        <span className="timer-lap__name">
                          {t('timerHistory.lapItem', { n: lap.lapNumber })}
                        </span>
                        <span className="timer-lap__range">
                          {formatClock(lap.startedAt, i18n.language)}
                          {' – '}
                          {formatClock(lap.endedAt, i18n.language)}
                        </span>
                      </div>
                      <strong className="timer-lap__dur">
                        {formatDurationCompact(lap.durationSeconds, t)}
                      </strong>
                    </div>
                    {lap.exercises.length === 0 ? (
                      <p className="timer-lap-card__empty">{t('timerHistory.noMachines')}</p>
                    ) : (
                      <ul className="timer-lap__exercises">
                        {lap.exercises.map((ex) => (
                          <li key={ex.id}>
                            <ExerciseRow ex={ex} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </PageShell>
    </div>
  );
}
