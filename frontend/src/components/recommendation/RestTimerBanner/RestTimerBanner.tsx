import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/recommendation.css';

interface RestTimerBannerProps {
  seconds: number;
  setNumber: number;
  onDismiss: () => void;
  /** Fired when rest finishes (timer → 0) — next set ready. */
  onReadyForNextSet?: () => void;
  /** Manual voice-count start during rest (does not require set-complete). */
  onStartCount?: () => void;
}

function formatCountdown(totalSeconds: number): string {
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

export function RestTimerBanner({
  seconds,
  setNumber,
  onDismiss,
  onReadyForNextSet,
  onStartCount,
}: RestTimerBannerProps) {
  const { t } = useTranslation('machines');
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const completedRef = useRef(false);
  const pausedRef = useRef(false);
  const remainingRef = useRef(seconds);
  const onReadyRef = useRef(onReadyForNextSet);
  onReadyRef.current = onReadyForNextSet;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    completedRef.current = false;
    setRemaining(seconds);
    remainingRef.current = seconds;
    setPaused(false);
    pausedRef.current = false;

    let cancelled = false;
    let timer: number | null = null;
    let lastTickAt = Date.now();

    const finish = () => {
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      setRemaining(0);
      remainingRef.current = 0;
      setPaused(false);
      void notifyRestComplete(
        t('restTimer.notificationTitle'),
        t('restTimer.notificationBody', { setNumber })
      );
      onReadyRef.current?.();
    };

    if (seconds <= 0) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    timer = window.setInterval(() => {
      if (cancelled || completedRef.current) return;
      const now = Date.now();
      if (pausedRef.current) {
        lastTickAt = now;
        return;
      }
      const elapsedMs = now - lastTickAt;
      lastTickAt = now;
      if (elapsedMs <= 0) return;

      const next = Math.max(0, remainingRef.current - elapsedMs / 1000);
      remainingRef.current = next;
      setRemaining(Math.ceil(next));
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
  }, [seconds, setNumber, t]);

  /** Exit rest UI like count [중지] — do not auto-start the next set. */
  const handleStop = () => {
    completedRef.current = true;
    onDismiss();
  };

  return (
    <div className="rest-timer-banner" role="status" aria-live="polite">
      <div className="rest-timer-banner__content">
        <span className="rest-timer-banner__label">
          {t('restTimer.label', { setNumber })}
          {paused ? ` · ${t('restTimer.paused')}` : ''}
        </span>
        <strong className="rest-timer-banner__time">{formatCountdown(remaining)}</strong>
      </div>
      <div className="rest-timer-banner__actions">
        {onStartCount ? (
          <button
            type="button"
            className="btn btn--primary rest-timer-banner__dismiss"
            onClick={onStartCount}
          >
            {t('voiceCoach.start')}
          </button>
        ) : null}
        {remaining > 0 ? (
          <button
            type="button"
            className="btn btn--secondary rest-timer-banner__dismiss"
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? t('restTimer.resume') : t('restTimer.pause')}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--secondary rest-timer-banner__dismiss"
          onClick={handleStop}
        >
          {remaining <= 0 ? t('restTimer.done') : t('voiceCoach.stop')}
        </button>
      </div>
    </div>
  );
}
