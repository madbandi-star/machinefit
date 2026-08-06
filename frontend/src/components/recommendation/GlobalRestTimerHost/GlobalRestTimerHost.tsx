import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { WorkoutDisplayOverlay } from '@/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay';
import { useSettingsStore } from '@/store/settings.store';
import {
  invokeRestTimerStartCount,
  useRestTimerStore,
} from '@/store/restTimer.store';

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

/**
 * Layout-level rest timer host so countdown survives route changes / other API screens.
 */
export function GlobalRestTimerHost() {
  const { t } = useTranslation('machines');
  const location = useLocation();
  const session = useRestTimerStore((s) => s.session);
  const displayOverride = useRestTimerStore((s) => s.displayOverride);
  const pause = useRestTimerStore((s) => s.pause);
  const resume = useRestTimerStore((s) => s.resume);
  const stop = useRestTimerStore((s) => s.stop);
  const complete = useRestTimerStore((s) => s.complete);
  const minimize = useRestTimerStore((s) => s.minimize);
  const expand = useRestTimerStore((s) => s.expand);
  const getRemainingSec = useRestTimerStore((s) => s.getRemainingSec);
  const isPaused = useRestTimerStore((s) => s.isPaused);
  const startCountAvailable = useRestTimerStore((s) => s.startCountAvailable);
  const workoutFullscreenDisplay = useSettingsStore((s) => s.workoutFullscreenDisplay);

  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const completedRef = useRef(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (useRestTimerStore.getState().session) {
        minimize();
      }
    }
  }, [location.pathname, minimize]);

  useEffect(() => {
    completedRef.current = false;
    if (!session) {
      setRemaining(0);
      setPaused(false);
      return;
    }

    setRemaining(getRemainingSec());
    setPaused(isPaused());

    const timer = window.setInterval(() => {
      const state = useRestTimerStore.getState();
      if (!state.session) return;
      const next = state.getRemainingSec();
      setRemaining(next);
      setPaused(state.isPaused());
      if (next <= 0 && !state.isPaused() && !completedRef.current) {
        completedRef.current = true;
        void notifyRestComplete(
          t('restTimer.notificationTitle'),
          t('restTimer.notificationBody', { setNumber: state.session.setNumber })
        );
        complete();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [session?.sessionId, complete, getRemainingSec, isPaused, t]);

  if (!session) return null;

  const showFull =
    displayOverride === 'full' ||
    (displayOverride === 'auto' && workoutFullscreenDisplay);

  const onPauseToggle = () => {
    if (remaining <= 0) return;
    if (isPaused()) resume();
    else pause();
  };

  const onStartCount = () => {
    invokeRestTimerStartCount();
  };

  if (showFull) {
    return (
      <WorkoutDisplayOverlay
        mode="rest"
        restSeconds={remaining}
        restSetNumber={session.setNumber}
        restControlled
        restPaused={paused}
        onRestPauseToggle={onPauseToggle}
        onRestDismiss={stop}
        onMinimize={minimize}
        onStartCount={onStartCount}
        showStartCount={startCountAvailable}
        phase="idle"
        currentRep={0}
        countdown={null}
        turbo={false}
        intensity={0}
        onStopCount={() => undefined}
      />
    );
  }

  return (
    <RestTimerBanner
      setNumber={session.setNumber}
      remaining={remaining}
      paused={paused}
      onPauseToggle={onPauseToggle}
      onDismiss={stop}
      onExpand={expand}
      onStartCount={startCountAvailable ? onStartCount : undefined}
    />
  );
}
