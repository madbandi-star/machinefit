import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/recommendation.css';

interface RestTimerBannerProps {
  seconds: number;
  setNumber: number;
  onDismiss: () => void;
  /** Fired when rest finishes (timer → 0) or user skips early — next set ready. */
  onReadyForNextSet?: () => void;
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
}: RestTimerBannerProps) {
  const { t } = useTranslation('machines');
  const [remaining, setRemaining] = useState(seconds);
  const completedRef = useRef(false);
  const onReadyRef = useRef(onReadyForNextSet);
  onReadyRef.current = onReadyForNextSet;

  useEffect(() => {
    setRemaining(seconds);
    completedRef.current = false;
  }, [seconds, setNumber]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        void notifyRestComplete(
          t('restTimer.notificationTitle'),
          t('restTimer.notificationBody', { setNumber })
        );
        onReadyRef.current?.();
      }
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remaining, setNumber, t]);

  const handleDismiss = () => {
    if (remaining > 0 && !completedRef.current) {
      completedRef.current = true;
      onReadyRef.current?.();
    }
    onDismiss();
  };

  return (
    <div className="rest-timer-banner" role="status" aria-live="polite">
      <div className="rest-timer-banner__content">
        <span className="rest-timer-banner__label">
          {t('restTimer.label', { setNumber })}
        </span>
        <strong className="rest-timer-banner__time">{formatCountdown(remaining)}</strong>
      </div>
      <button type="button" className="btn btn--secondary rest-timer-banner__dismiss" onClick={handleDismiss}>
        {remaining <= 0 ? t('restTimer.done') : t('restTimer.skip')}
      </button>
    </div>
  );
}
