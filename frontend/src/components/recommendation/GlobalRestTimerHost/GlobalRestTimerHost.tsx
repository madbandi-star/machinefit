import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { WorkoutDisplayOverlay } from '@/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay';
import { useSettingsStore } from '@/store/settings.store';
import {
  invokeRestTimerStartCount,
  useRestTimerStore,
} from '@/store/restTimer.store';
import { useVoiceCoachSessionStore } from '@/store/voiceCoachSession.store';
import { publishRestLockScreen } from '@/utils/workoutLockScreen';

function publishRestLockScreenIfIdleCount(options: {
  setNumber: number;
  remainingSec: number;
  paused: boolean;
}): void {
  // Count takes priority on the lock screen when both are active.
  if (useVoiceCoachSessionStore.getState().isRunning()) return;
  publishRestLockScreen(options);
}

const REST_TIMER_SLOT_ID = 'mf-rest-timer-slot';

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
 * Compact UI portals into the home rest-button slot when available; otherwise docks
 * above the bottom nav.
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
  const [slotEl, setSlotEl] = useState<HTMLElement | null>(null);
  const completedRef = useRef(false);
  const prevPathRef = useRef(location.pathname);
  const lastLockSecRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (useRestTimerStore.getState().session) {
        minimize();
      }
    }
  }, [location.pathname, minimize]);

  useEffect(() => {
    if (!session) {
      setSlotEl(null);
      return;
    }
    const resolve = () => {
      setSlotEl(document.getElementById(REST_TIMER_SLOT_ID));
    };
    resolve();
    // Home tools mount after first paint on some navigations.
    const raf = window.requestAnimationFrame(resolve);
    return () => window.cancelAnimationFrame(raf);
  }, [session?.sessionId, location.pathname]);

  useEffect(() => {
    completedRef.current = false;
    if (!session) {
      setRemaining(0);
      setPaused(false);
      return;
    }

    setRemaining(getRemainingSec());
    setPaused(isPaused());
    lastLockSecRef.current = null;
    publishRestLockScreenIfIdleCount({
      setNumber: session.setNumber,
      remainingSec: getRemainingSec(),
      paused: isPaused(),
    });

    const timer = window.setInterval(() => {
      const state = useRestTimerStore.getState();
      if (!state.session) return;
      const next = state.getRemainingSec();
      const nextPaused = state.isPaused();
      setRemaining(next);
      setPaused(nextPaused);
      // Lock screen: update once per second (MediaMetadata rewrite is relatively heavy).
      if (lastLockSecRef.current !== next) {
        lastLockSecRef.current = next;
        publishRestLockScreenIfIdleCount({
          setNumber: state.session.setNumber,
          remainingSec: next,
          paused: nextPaused,
        });
      }
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

  const placement = slotEl ? 'inline' : 'dock';
  const mountNode = slotEl ?? document.body;

  return createPortal(
    <RestTimerBanner
      setNumber={session.setNumber}
      remaining={remaining}
      paused={paused}
      onPauseToggle={onPauseToggle}
      onDismiss={stop}
      onExpand={expand}
      onStartCount={startCountAvailable ? onStartCount : undefined}
      placement={placement}
    />,
    mountNode
  );
}
