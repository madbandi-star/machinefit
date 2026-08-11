import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePersistHydration } from '@/hooks/usePersistHydration';
import {
  formatWorkoutSessionElapsed,
  getWorkoutSessionElapsedMs,
  useWorkoutSessionTimerStore,
} from '@/store/workoutSessionTimer.store';

/**
 * Home-only workout session timer: display + exactly two buttons.
 * Elapsed time is timestamp-based; pause gaps are excluded. Persists across refresh/navigation.
 */
export function HomeWorkoutSessionTimer() {
  const { t } = useTranslation('common');
  const hydrated = usePersistHydration(useWorkoutSessionTimerStore.persist);
  const status = useWorkoutSessionTimerStore((s) => s.status);
  const segmentStartedAtMs = useWorkoutSessionTimerStore((s) => s.segmentStartedAtMs);
  const accumulatedMs = useWorkoutSessionTimerStore((s) => s.accumulatedMs);
  const start = useWorkoutSessionTimerStore((s) => s.start);
  const pause = useWorkoutSessionTimerStore((s) => s.pause);
  const resume = useWorkoutSessionTimerStore((s) => s.resume);
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
      <div className="home-session-timer__display" aria-live="polite" aria-atomic="true">
        <span className="home-session-timer__label">{t('pages.home.sessionTimerTitle')}</span>
        <span className="home-session-timer__time" data-status={status}>
          {display}
        </span>
      </div>
      <div className="home-session-timer__actions">
        <button
          type="button"
          className="btn btn--primary home-session-timer__btn"
          onClick={handlePrimary}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          className="btn btn--secondary home-session-timer__btn"
          disabled={isIdle}
          onClick={end}
        >
          {t('pages.home.sessionTimerEnd')}
        </button>
      </div>
    </section>
  );
}
