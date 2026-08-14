import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import {
  formatWorkoutSessionElapsed,
  getWorkoutSessionElapsedMs,
  useWorkoutSessionTimerStore,
} from '@/store/workoutSessionTimer.store';
import '@/styles/workout-complete.css';

interface WorkoutEndConfirmSheetProps {
  open: boolean;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * End-session confirm — same cinematic language as TODAY'S WORKOUT report,
 * not the generic ConfirmDialog card.
 */
export function WorkoutEndConfirmSheet({
  open,
  confirming = false,
  onClose,
  onConfirm,
}: WorkoutEndConfirmSheetProps) {
  const { t } = useTranslation('common');
  const dialogRef = useModalAccessibility({ open, onClose });
  const status = useWorkoutSessionTimerStore((s) => s.status);
  const segmentStartedAtMs = useWorkoutSessionTimerStore((s) => s.segmentStartedAtMs);
  const accumulatedMs = useWorkoutSessionTimerStore((s) => s.accumulatedMs);
  const laps = useWorkoutSessionTimerStore((s) => s.laps);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!open || status !== 'running') return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [open, status]);

  if (!open) return null;

  const elapsedMs = getWorkoutSessionElapsedMs(
    { status, segmentStartedAtMs, accumulatedMs },
    status === 'running' ? nowMs : Date.now()
  );
  const elapsedLabel = formatWorkoutSessionElapsed(elapsedMs);
  const lapCount = laps.length;

  return (
    <div className="dialog-overlay wcr-overlay wec-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="wec-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wec-title"
        aria-describedby="wec-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wec-sheet__glow" aria-hidden="true" />

        <p className="wec-brand">{t('workoutComplete.brand')}</p>
        <p className="wec-kicker">{t('workoutComplete.todaysWorkout')}</p>

        <h2 id="wec-title" className="wec-title">
          {t('workoutComplete.confirmTitle')}
        </h2>
        <p id="wec-message" className="wec-message">
          {t('workoutComplete.confirmMessage')}
        </p>

        <div className="wec-stats" aria-label={t('workoutComplete.confirmStatsAria')}>
          <div className="wec-stat">
            <span className="wec-stat__label">{t('workoutComplete.statDuration')}</span>
            <strong className="wec-stat__value" aria-live="polite">
              {elapsedLabel}
            </strong>
          </div>
          <div className="wec-stat">
            <span className="wec-stat__label">{t('workoutComplete.confirmLapsLabel')}</span>
            <strong className="wec-stat__value">{lapCount}</strong>
          </div>
        </div>

        <div className="wec-actions">
          <button
            type="button"
            className="wcr-btn wcr-btn--share wec-btn-end"
            disabled={confirming}
            onClick={onConfirm}
          >
            <span className="wcr-btn__stack">
              <span className="wcr-btn__primary">{t('workoutComplete.confirmAction')}</span>
              <span className="wcr-btn__secondary">{t('workoutComplete.confirmActionHint')}</span>
            </span>
          </button>
          <button
            type="button"
            className="wcr-btn wcr-btn--done"
            disabled={confirming}
            onClick={onClose}
          >
            {t('actions.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
