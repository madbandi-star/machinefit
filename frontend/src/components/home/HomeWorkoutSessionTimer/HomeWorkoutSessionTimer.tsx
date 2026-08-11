import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersistHydration } from '@/hooks/usePersistHydration';
import {
  formatWorkoutSessionElapsed,
  formatWorkoutSessionLap,
  getWorkoutSessionElapsedMs,
  useWorkoutSessionTimerStore,
} from '@/store/workoutSessionTimer.store';

/**
 * Home workout session timer: start/pause/resume/end + iPhone-style LAP splits.
 * Elapsed time is timestamp-based; pause gaps are excluded. Persists across refresh/navigation.
 */
export function HomeWorkoutSessionTimer() {
  const { t } = useTranslation('common');
  const hydrated = usePersistHydration(useWorkoutSessionTimerStore.persist);
  const status = useWorkoutSessionTimerStore((s) => s.status);
  const segmentStartedAtMs = useWorkoutSessionTimerStore((s) => s.segmentStartedAtMs);
  const accumulatedMs = useWorkoutSessionTimerStore((s) => s.accumulatedMs);
  const laps = useWorkoutSessionTimerStore((s) => s.laps);
  const lastEndedElapsedMs = useWorkoutSessionTimerStore((s) => s.lastEndedElapsedMs);
  const start = useWorkoutSessionTimerStore((s) => s.start);
  const pause = useWorkoutSessionTimerStore((s) => s.pause);
  const resume = useWorkoutSessionTimerStore((s) => s.resume);
  const lap = useWorkoutSessionTimerStore((s) => s.lap);
  const end = useWorkoutSessionTimerStore((s) => s.end);

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!hydrated || status !== 'running') return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [hydrated, status]);

  if (!hydrated) {
    return (
      <section
        className="home-session-timer"
        aria-label={t('pages.home.sessionTimerTitle')}
        aria-busy="true"
      >
        <div className="home-session-timer__display">
          <span className="home-session-timer__label">{t('pages.home.sessionTimerTitle')}</span>
          <span className="home-session-timer__time">00:00:00</span>
        </div>
        <div className="home-session-timer__actions">
          <button type="button" className="btn btn--primary home-session-timer__btn" disabled>
            {t('pages.home.sessionTimerStart')}
          </button>
          <button type="button" className="btn btn--secondary home-session-timer__btn" disabled>
            {t('pages.home.sessionTimerEnd')}
          </button>
        </div>
      </section>
    );
  }

  const elapsedMs = getWorkoutSessionElapsedMs(
    { status, segmentStartedAtMs, accumulatedMs },
    status === 'running' ? nowMs : Date.now()
  );
  const display = formatWorkoutSessionElapsed(elapsedMs);
  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const showLapButton = status === 'running' || status === 'paused';
  const showEndedSummary = isIdle && lastEndedElapsedMs != null;
  const endedDisplay =
    lastEndedElapsedMs != null ? formatWorkoutSessionElapsed(lastEndedElapsedMs) : null;

  const primaryLabel =
    status === 'running'
      ? t('pages.home.sessionTimerPause')
      : status === 'paused'
        ? t('pages.home.sessionTimerResume')
        : t('pages.home.sessionTimerStart');

  const handlePrimary = () => {
    if (status === 'idle') start();
    else if (status === 'running') pause();
    else resume();
  };

  return (
    <section
      className="home-session-timer"
      aria-label={t('pages.home.sessionTimerTitle')}
    >
      <div className="home-session-timer__row">
        <div className="home-session-timer__display" aria-live="polite" aria-atomic="true">
          <span className="home-session-timer__label">{t('pages.home.sessionTimerTitle')}</span>
          <div className="home-session-timer__time-line">
            <span className="home-session-timer__time" data-status={status}>
              {showEndedSummary ? '00:00:00' : display}
            </span>
            {showEndedSummary && endedDisplay ? (
              <span
                className="home-session-timer__ended"
                aria-label={`${t('pages.home.sessionTimerEndedLabel')} ${endedDisplay}`}
              >
                <span className="home-session-timer__ended-label">
                  {t('pages.home.sessionTimerEndedLabel')}
                </span>
                <span className="home-session-timer__ended-time">{endedDisplay}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="home-session-timer__actions">
          <button
            type="button"
            className="btn btn--primary home-session-timer__btn"
            onClick={handlePrimary}
          >
            {primaryLabel}
          </button>
          {showLapButton ? (
            <button
              type="button"
              className="btn btn--secondary home-session-timer__btn home-session-timer__btn--lap"
              disabled={!isRunning}
              onClick={lap}
              aria-label={t('pages.home.sessionTimerLapAria')}
            >
              {t('pages.home.sessionTimerLap')}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--secondary home-session-timer__btn"
            disabled={isIdle}
            onClick={end}
          >
            {t('pages.home.sessionTimerEnd')}
          </button>
        </div>
      </div>

      {laps.length > 0 ? (
        <ol className="home-session-timer__laps" aria-label={t('pages.home.sessionTimerLaps')}>
          {laps.map((item) => (
            <li key={`${item.index}-${item.recordedAtMs}`} className="home-session-timer__lap">
              <span className="home-session-timer__lap-index">
                {t('pages.home.sessionTimerLapItem', { n: item.index })}
              </span>
              <span className="home-session-timer__lap-split">
                {formatWorkoutSessionLap(item.splitMs)}
              </span>
              <span className="home-session-timer__lap-total">
                {formatWorkoutSessionElapsed(item.totalElapsedMs)}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
