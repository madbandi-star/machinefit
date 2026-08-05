import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { VoiceCoachPhase } from '@/utils/voiceCoach';
import {
  getVoiceCoachCueIcon,
  getVoiceCoachDisplayState,
  isRedundantVoiceCoachStatus,
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
  isCountPaused?: boolean;
  onPauseCount?: () => void;
  onResumeCount?: () => void;
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
  isCountPaused = false,
  onPauseCount,
  onResumeCount,
  onStopCount,
}: WorkoutDisplayOverlayProps) {
  const { t } = useTranslation(['machines', 'common']);
  const [restRemaining, setRestRemaining] = useState(restSeconds);
  const [restPaused, setRestPaused] = useState(false);
  const restCompletedRef = useRef(false);
  const restPausedRef = useRef(false);
  const restRemainingRef = useRef(restSeconds);
  const onRestReadyRef = useRef(onRestReadyForNextSet);
  onRestReadyRef.current = onRestReadyForNextSet;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    restRemainingRef.current = restRemaining;
  }, [restRemaining]);

  useEffect(() => {
    restPausedRef.current = restPaused;
  }, [restPaused]);

  useEffect(() => {
    if (mode !== 'rest') {
      setRestPaused(false);
      return;
    }

    restCompletedRef.current = false;
    setRestRemaining(restSeconds);
    restRemainingRef.current = restSeconds;
    setRestPaused(false);
    restPausedRef.current = false;

    let cancelled = false;
    let timer: number | null = null;
    let lastTickAt = Date.now();

    const finish = () => {
      if (cancelled || restCompletedRef.current) return;
      restCompletedRef.current = true;
      setRestRemaining(0);
      restRemainingRef.current = 0;
      setRestPaused(false);
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

    timer = window.setInterval(() => {
      if (cancelled || restCompletedRef.current) return;
      const now = Date.now();
      if (restPausedRef.current) {
        lastTickAt = now;
        return;
      }
      const elapsedMs = now - lastTickAt;
      lastTickAt = now;
      if (elapsedMs <= 0) return;

      const next = Math.max(0, restRemainingRef.current - elapsedMs / 1000);
      restRemainingRef.current = next;
      setRestRemaining(Math.ceil(next));
      if (next <= 0) {
        if (timer != null) window.clearInterval(timer);
        timer = null;
        finish();
      }
    }, 100);

    return () => {
      cancelled = true;
      if (timer != null) window.clearInterval(timer);
    };
  }, [mode, restSeconds, restSetNumber, t]);

  /** Exit rest overlay like count [중지] — do not auto-start the next set. */
  const handleRestStop = () => {
    restCompletedRef.current = true;
    onRestDismiss();
  };

  const handleRestPauseToggle = () => {
    if (restRemaining <= 0 || restCompletedRef.current) return;
    setRestPaused((prev) => !prev);
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
  const showRestPause = mode === 'rest' && restRemaining > 0;
  const isTextCue =
    Boolean(display.displayNumber) &&
    display.displayNumber !== '!' &&
    !/^\d+!?$/.test(display.displayNumber);
  const countScale = isTextCue ? Math.min(display.scale, 1.08) : display.scale;
  const cueIcon = getVoiceCoachCueIcon(
    phase,
    display.displayNumber,
    turbo,
    display.climaxStage
  );
  const showStatus =
    mode === 'count' &&
    (isCountPaused ||
      !isRedundantVoiceCoachStatus(display.displayNumber, status, phase));

  return createPortal(
    <div
      className={`workout-display-overlay workout-display-overlay--${mode}${
        display.turboStage ? ' workout-display-overlay--turbo' : ''
      }${restPaused || isCountPaused ? ' workout-display-overlay--paused' : ''}`}
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
              {restPaused ? ` · ${t('machines:restTimer.paused')}` : ''}
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
                className={`workout-display-overlay__cue${
                  display.turboStage ? ' workout-display-overlay__cue--turbo' : ''
                }${display.climaxStage ? ' workout-display-overlay__cue--climax' : ''}${
                  isTextCue ? ' workout-display-overlay__cue--text' : ''
                }`}
                style={{
                  transform: `scale(${countScale})`,
                  ['--count-shake' as string]: `${
                    display.turboStage ? 1.2 + intensity : intensity * 0.6
                  }px`,
                }}
                aria-hidden="true"
              >
                <span className="workout-display-overlay__cue-icon">{cueIcon}</span>
                <span className="workout-display-overlay__cue-text">{display.displayNumber}</span>
              </span>
            ) : null}
            {showStatus ? (
              <p className="workout-display-overlay__status" role="status" aria-live="polite">
                {isCountPaused ? t('machines:voiceCoach.paused') : status}
              </p>
            ) : null}
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
            {showRestPause ? (
              <button
                type="button"
                className="btn btn--secondary btn--block workout-display-overlay__action"
                onClick={handleRestPauseToggle}
              >
                {restPaused
                  ? t('machines:restTimer.resume')
                  : t('machines:restTimer.pause')}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--block workout-display-overlay__action"
              onClick={handleRestStop}
            >
              {restRemaining <= 0
                ? t('machines:restTimer.done')
                : t('machines:voiceCoach.stop')}
            </button>
          </>
        ) : (
          <>
            {onPauseCount && onResumeCount ? (
              <button
                type="button"
                className="btn btn--secondary btn--block workout-display-overlay__action"
                onClick={isCountPaused ? onResumeCount : onPauseCount}
              >
                {isCountPaused
                  ? t('machines:voiceCoach.resume')
                  : t('machines:voiceCoach.pause')}
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--block workout-display-overlay__action"
              onClick={onStopCount}
            >
              {t('machines:voiceCoach.stop')}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
