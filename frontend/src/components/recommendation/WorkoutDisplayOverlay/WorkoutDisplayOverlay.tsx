import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { VoiceCoachPhase } from '@/utils/voiceCoach';
import {
  getVoiceCoachDisplayState,
  voiceCoachStatusLabel,
} from '@/utils/voiceCoachDisplay';
import '@/styles/recommendation.css';

const BRAND_MARK_SRC = `${import.meta.env.BASE_URL}assets/brand/machinefit-mark.svg`;

export type WorkoutDisplayOverlayMode = 'rest' | 'count';

interface WorkoutDisplayOverlayProps {
  mode: WorkoutDisplayOverlayMode;
  restSeconds: number;
  restSetNumber: number;
  onRestDismiss: () => void;
  onRestReadyForNextSet?: () => void;
  onStartCount?: () => void;
  showStartCount?: boolean;
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  onStopCount: () => void;
}

function formatRestTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function notifyRestComplete(title: string, body: string): Promise<void> {
  if (!('Notification' in window)) return;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    new Notification(title, { body, tag: 'machinefit-rest-timer' });
  }
}

export function WorkoutDisplayOverlay({
  mode,
  restSeconds,
  restSetNumber,
  onRestDismiss,
  onRestReadyForNextSet,
  onStartCount,
  showStartCount = false,
  phase,
  currentRep,
  countdown,
  turbo,
  intensity,
  onStopCount,
}: WorkoutDisplayOverlayProps) {
  const { t } = useTranslation(['machines', 'common']);
  const [restRemaining, setRestRemaining] = useState(restSeconds);
  const restCompletedRef = useRef(false);
  const onRestReadyRef = useRef(onRestReadyForNextSet);
  onRestReadyRef.current = onRestReadyForNextSet;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (mode !== 'rest') return;

    restCompletedRef.current = false;
    setRestRemaining(restSeconds);
    let cancelled = false;

    const finish = () => {
      if (cancelled || restCompletedRef.current) return;
      restCompletedRef.current = true;
      setRestRemaining(0);
      void notifyRestComplete(
        t('machines:restTimer.notificationTitle'),
        t('machines:restTimer.notificationBody', { setNumber: restSetNumber })
      );
      onRestReadyRef.current?.();
    };

    if (restSeconds <= 0) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, restSeconds - elapsedSec);
      setRestRemaining(next);
      if (next <= 0) {
        window.clearInterval(timer);
        finish();
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode, restSeconds, restSetNumber, t]);

  const handleRestDismiss = () => {
    if (restRemaining > 0 && !restCompletedRef.current) {
      restCompletedRef.current = true;
      onRestReadyRef.current?.();
    }
    onRestDismiss();
  };

  const oneMoreShort = t('machines:voiceCoach.oneMoreShort', { defaultValue: '하나더' });
  const display = getVoiceCoachDisplayState(
    phase,
    currentRep,
    countdown,
    turbo,
    intensity,
    oneMoreShort,
    t('machines:voiceCoach.holdCueShort')
  );
  const status = voiceCoachStatusLabel(t, phase, currentRep, countdown);

  return createPortal(
    <div
      className={`workout-display-overlay workout-display-overlay--${mode}${
        display.turboStage ? ' workout-display-overlay--turbo' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === 'rest'
          ? t('machines:restTimer.label', { setNumber: restSetNumber })
          : t('machines:voiceCoach.title')
      }
    >
      <div className="workout-display-overlay__brand" aria-hidden="true">
        <img
          className="workout-display-overlay__brand-mark"
          src={BRAND_MARK_SRC}
          alt=""
          width={34}
          height={34}
          decoding="async"
        />
        <span className="workout-display-overlay__brand-name">
          Machine<span className="workout-display-overlay__brand-fit">Fit</span>
        </span>
      </div>

      <div className="workout-display-overlay__main">
        {mode === 'rest' ? (
          <>
            <span className="workout-display-overlay__label">
              {t('machines:restTimer.label', { setNumber: restSetNumber })}
            </span>
            <strong className="workout-display-overlay__time" aria-live="polite">
              {formatRestTime(restRemaining)}
            </strong>
          </>
        ) : (
          <>
            {display.showLiveDisplay ? (
              <span
                key={`${phase}-${display.displayNumber}`}
                className={`workout-display-overlay__count${
                  display.climaxStage ? ' workout-display-overlay__count--climax' : ''
                }`}
                style={{
                  transform: `scale(${display.scale})`,
                  ['--count-shake' as string]: `${
                    display.turboStage ? 1.2 + intensity : intensity * 0.6
                  }px`,
                }}
                aria-hidden="true"
              >
                {display.displayNumber}
              </span>
            ) : null}
            <p className="workout-display-overlay__status" role="status" aria-live="polite">
              {status}
              {turbo ? ` · ${t('machines:voiceCoach.turboBadge')}` : ''}
              {phase === 'hold' ? ` · ${t('machines:voiceCoach.holdBadge')}` : ''}
            </p>
          </>
        )}
      </div>

      <div className="workout-display-overlay__actions">
        {mode === 'rest' ? (
          <>
            {showStartCount && onStartCount ? (
              <button
                type="button"
                className="btn btn--primary btn--block workout-display-overlay__action"
                onClick={onStartCount}
              >
                {t('machines:voiceCoach.start')}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--block workout-display-overlay__action"
              onClick={handleRestDismiss}
            >
              {restRemaining <= 0 ? t('machines:restTimer.done') : t('machines:restTimer.skip')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--secondary btn--block workout-display-overlay__action"
            onClick={onStopCount}
          >
            {t('machines:voiceCoach.stop')}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
