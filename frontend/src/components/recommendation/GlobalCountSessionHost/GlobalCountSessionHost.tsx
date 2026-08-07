import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { CountSessionBanner } from '@/components/recommendation/CountSessionBanner/CountSessionBanner';
import { WorkoutDisplayOverlay } from '@/components/recommendation/WorkoutDisplayOverlay/WorkoutDisplayOverlay';
import { useRestTimerStore } from '@/store/restTimer.store';
import { useSettingsStore } from '@/store/settings.store';
import { useVoiceCoachSessionStore } from '@/store/voiceCoachSession.store';

/**
 * Layout-level count host so voice counting survives route changes.
 * Mirrors GlobalRestTimerHost: fullscreen overlay or compact banner (home slot / dock).
 */
export function GlobalCountSessionHost() {
  const location = useLocation();
  const phase = useVoiceCoachSessionStore((s) => s.phase);
  const currentRep = useVoiceCoachSessionStore((s) => s.currentRep);
  const countdown = useVoiceCoachSessionStore((s) => s.countdown);
  const turbo = useVoiceCoachSessionStore((s) => s.turbo);
  const intensity = useVoiceCoachSessionStore((s) => s.intensity);
  const isPaused = useVoiceCoachSessionStore((s) => s.isPaused);
  const displayOverride = useVoiceCoachSessionStore((s) => s.displayOverride);
  const sessionId = useVoiceCoachSessionStore((s) => s.sessionId);
  const pause = useVoiceCoachSessionStore((s) => s.pause);
  const resume = useVoiceCoachSessionStore((s) => s.resume);
  const stop = useVoiceCoachSessionStore((s) => s.stop);
  const minimize = useVoiceCoachSessionStore((s) => s.minimize);
  const expand = useVoiceCoachSessionStore((s) => s.expand);
  const workoutFullscreenDisplay = useSettingsStore((s) => s.workoutFullscreenDisplay);
  const restActive = useRestTimerStore((s) => s.session != null);
  const prevPathRef = useRef(location.pathname);

  const isRunning = phase !== 'idle' && phase !== 'done';

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      if (useVoiceCoachSessionStore.getState().isRunning()) {
        minimize();
      }
    }
  }, [location.pathname, minimize]);

  if (!isRunning) return null;

  const showFull =
    displayOverride === 'full' ||
    (displayOverride === 'auto' && workoutFullscreenDisplay);

  if (showFull) {
    return (
      <WorkoutDisplayOverlay
        key={sessionId ?? 'count'}
        mode="count"
        restSeconds={0}
        restSetNumber={1}
        onRestDismiss={() => undefined}
        onMinimize={minimize}
        phase={phase}
        currentRep={currentRep}
        countdown={countdown}
        turbo={turbo}
        intensity={intensity}
        isCountPaused={isPaused}
        onPauseCount={pause}
        onResumeCount={resume}
        onStopCount={stop}
      />
    );
  }

  return (
    <CountSessionBanner
      key={sessionId ?? 'count-banner'}
      phase={phase}
      currentRep={currentRep}
      countdown={countdown}
      turbo={turbo}
      intensity={intensity}
      isPaused={isPaused}
      onPause={pause}
      onResume={resume}
      onStop={stop}
      onExpand={workoutFullscreenDisplay ? expand : undefined}
      placement="auto"
      offsetForRest={restActive}
    />
  );
}
