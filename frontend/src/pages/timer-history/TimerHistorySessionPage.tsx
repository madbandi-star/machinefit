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

function sessionTotals(session: TimerHistorySessionDetail) {
  const machineKeys = new Set<string>();
  let setTotal = 0;
  for (const lap of session.laps) {
    for (const ex of lap.exercises) {
      machineKeys.add(ex.machineCode || ex.machineId || ex.machineName || ex.id);
      if (ex.setCount != null && Number.isFinite(ex.setCount)) {
        setTotal += Math.max(0, Math.floor(ex.setCount));
      }
    }
  }
  return { machines: machineKeys.size, sets: setTotal };
}

function ExerciseRow({ ex, index }: { ex: TimerHistoryLapExercise; index: number }) {
  const { t } = useTranslation('common');
  const name = ex.machineName || t('timerHistory.unknownMachine');
  const setLabel = ex.setCount != null ? t('timerHistory.setCount', { count: ex.setCount }) : null;
  const weights = formatSetWeightsKg(ex.setWeightsKg, t);
  const inner = (
    <>
      <span className="timer-ex__ord" aria-hidden>
        {index}
      </span>
      <span className="timer-ex__body">
        <span className="timer-ex__name">{name}</span>
        {setLabel || weights ? (
          <span className="timer-ex__chips">
            {setLabel ? <span className="timer-ex__chip">{setLabel}</span> : null}
            {weights ? <span className="timer-ex__chip">{weights}</span> : null}
          </span>
        ) : null}
      </span>
      {ex.machineCode ? (
        <Icon name="chevronRight" size={18} className="timer-ex__chevron" aria-hidden />
      ) : null}
    </>
  );

  if (ex.machineCode) {
    return (
      <Link
        className="timer-ex"
        to={ROUTES.MACHINE_DETAIL.replace(':machineCode', ex.machineCode)}
        aria-label={name}
      >
        {inner}
      </Link>
    );
  }

  return <div className="timer-ex is-static">{inner}</div>;
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
  const totals = useMemo(() => (session ? sessionTotals(session) : { machines: 0, sets: 0 }), [session]);

  if (query.isLoading) {
    return (
      <div className="timer-history-page timer-history-page--session">
        <PageShell>
          <Skeleton height={200} />
          <Skeleton count={3} height={110} />
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

        <header className="timer-session-detail" aria-label={t('timerHistory.sessionTitle')}>
          <p className="timer-session-detail__date">{formatHistoryDateHeader(dateKey, i18n.language)}</p>
          <p className="timer-session-detail__clock">{formatTimerClock(session.durationSeconds)}</p>
          <p className="timer-session-detail__label">{t('timerHistory.totalDuration')}</p>
          <p className="timer-session-detail__range">
            <span className="timer-session-detail__chip">
              {formatClock(session.startedAt, i18n.language)}
              {' – '}
              {formatClock(session.endedAt, i18n.language)}
            </span>
          </p>
          <div className="timer-session-detail__stats">
            <div className="timer-session-detail__stat">
              <strong>{session.lapCount}</strong>
              <span>{t('timerHistory.statLaps')}</span>
            </div>
            <div className="timer-session-detail__stat">
              <strong>{totals.machines}</strong>
              <span>{t('timerHistory.statMachines')}</span>
            </div>
            <div className="timer-session-detail__stat">
              <strong>{totals.sets}</strong>
              <span>{t('timerHistory.statSets')}</span>
            </div>
          </div>
        </header>

        <section className="timer-session-laps" aria-label={t('timerHistory.lapsHeading')}>
          <div className="timer-session-laps__head">
            <h2>{t('timerHistory.lapsHeading')}</h2>
            <span className="timer-session-laps__count">{session.lapCount}</span>
          </div>
          {session.laps.length === 0 ? (
            <p className="timer-lap-block__empty">{t('timerHistory.noLaps')}</p>
          ) : (
            <ol className="timer-lap-list">
              {session.laps.map((lap) => (
                <li key={lap.id} className="timer-lap-block">
                  <div className="timer-lap-block__head">
                    <span className="timer-lap-block__num" aria-hidden>
                      {lap.lapNumber}
                    </span>
                    <div className="timer-lap-block__meta">
                      <strong className="timer-lap-block__dur">
                        {formatDurationCompact(lap.durationSeconds, t)}
                      </strong>
                      <span className="timer-lap-block__range">
                        {formatClock(lap.startedAt, i18n.language)}
                        {' – '}
                        {formatClock(lap.endedAt, i18n.language)}
                      </span>
                    </div>
                    <span className="visually-hidden">
                      {t('timerHistory.lapItem', { n: lap.lapNumber })}
                    </span>
                  </div>
                  {lap.exercises.length === 0 ? (
                    <p className="timer-lap-block__empty">{t('timerHistory.noMachines')}</p>
                  ) : (
                    <ul className="timer-lap-block__exercises">
                      {lap.exercises.map((ex, i) => (
                        <li key={ex.id}>
                          <ExerciseRow ex={ex} index={i + 1} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </PageShell>
    </div>
  );
}
