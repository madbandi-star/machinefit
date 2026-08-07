import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2 } from 'lucide-react';
import '@/styles/recommendation.css';

interface RestTimerBannerProps {
  setNumber: number;
  onDismiss: () => void;
  /** Uncontrolled: starts internal countdown from this value. */
  seconds?: number;
  /** Controlled remaining seconds (from global store). */
  remaining?: number;
  paused?: boolean;
  onPauseToggle?: () => void;
  /** Fired when rest finishes (uncontrolled timer → 0). */
  onReadyForNextSet?: () => void;
  onStartCount?: () => void;
  onExpand?: () => void;
  onMinimize?: () => void;
  showMinimize?: boolean;
  /** `inline` = home rest-button slot; `dock` = floating above bottom nav. */
  placement?: 'inline' | 'dock';
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
  remaining: controlledRemaining,
  paused: controlledPaused,
  onPauseToggle,
  onExpand,
  onMinimize,
  showMinimize = false,
  placement = 'dock',
}: RestTimerBannerProps) {
  const { t } = useTranslation('machines');
  const controlled = controlledRemaining != null;
  const [remaining, setRemaining] = useState(seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const completedRef = useRef(false);
  const pausedRef = useRef(false);
  const remainingRef = useRef(seconds ?? 0);
  const onReadyRef = useRef(onReadyForNextSet);
  onReadyRef.current = onReadyForNextSet;

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    if (controlled) return;

    completedRef.current = false;
    const startSeconds = seconds ?? 0;
    setRemaining(startSeconds);
    remainingRef.current = startSeconds;
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

    if (startSeconds <= 0) {
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
  }, [controlled, seconds, setNumber, t]);

  const displayRemaining = controlled ? controlledRemaining : remaining;
  const displayPaused = controlled ? Boolean(controlledPaused) : paused;

  const handlePauseToggle = () => {
    if (controlled) {
      onPauseToggle?.();
      return;
    }
    setPaused((value) => !value);
  };

  /** Exit rest UI like count [중지] — do not auto-start the next set. */
  const handleStop = () => {
    completedRef.current = true;
    onDismiss();
  };

  return (
    <div
      className={`rest-timer-banner rest-timer-banner--${placement}`}
      role="status"
      aria-live="polite"
    >
      <div className="rest-timer-banner__content">
        <span className="rest-timer-banner__label">
          {t('restTimer.label', { setNumber })}
          {displayPaused ? ` · ${t('restTimer.paused')}` : ''}
        </span>
        <strong className="rest-timer-banner__time">{formatCountdown(displayRemaining)}</strong>
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
        {displayRemaining > 0 ? (
          <button
            type="button"
            className="btn btn--secondary rest-timer-banner__dismiss"
            onClick={handlePauseToggle}
          >
            {displayPaused ? t('restTimer.resume') : t('restTimer.pause')}
          </button>
        ) : null}
        {onExpand ? (
          <button
            type="button"
            className="btn btn--secondary rest-timer-banner__dismiss"
            onClick={onExpand}
            aria-label={t('restTimer.expand')}
          >
            <Maximize2 size={14} aria-hidden />
            <span className="rest-timer-banner__btn-label">{t('restTimer.expand')}</span>
          </button>
        ) : null}
        {showMinimize && onMinimize ? (
          <button
            type="button"
            className="btn btn--secondary rest-timer-banner__dismiss"
            onClick={onMinimize}
            aria-label={t('restTimer.minimize')}
          >
            <Minimize2 size={14} aria-hidden />
            <span className="rest-timer-banner__btn-label">{t('restTimer.minimize')}</span>
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn--secondary rest-timer-banner__dismiss"
          onClick={handleStop}
        >
          {displayRemaining <= 0 ? t('restTimer.done') : t('voiceCoach.stop')}
        </button>
      </div>
    </div>
  );
}
