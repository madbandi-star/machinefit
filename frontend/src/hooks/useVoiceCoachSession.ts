import { useCallback, useEffect } from 'react';
import type { VoiceCountMode } from '@/utils/aiCountPace';
import type { VoiceCoachPack, VoiceCoachPhase, VoiceCoachPrepCount } from '@/utils/voiceCoach';
import type { VoiceHoldFlowMode } from '@/utils/voiceHold';
import {
  useVoiceCoachSessionStore,
  type VoiceCoachSessionConfig,
} from '@/store/voiceCoachSession.store';

interface UseVoiceCoachSessionOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  oneMoreCount: number;
  repGapMs: number;
  prepCount: VoiceCoachPrepCount;
  voicePack: VoiceCoachPack;
  countMode: VoiceCountMode;
  flowMode: VoiceHoldFlowMode;
  holdDurationSec: number;
  locale: string;
  enabled: boolean;
}

export interface VoiceCoachSessionState {
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Facade over the global voice-coach session store.
 * Counting survives route changes; do not stop on unmount.
 */
export function useVoiceCoachSession({
  targetReps,
  oneMoreEnabled,
  oneMoreCount,
  repGapMs,
  prepCount,
  voicePack,
  countMode,
  flowMode,
  holdDurationSec,
  locale,
  enabled,
}: UseVoiceCoachSessionOptions): VoiceCoachSessionState {
  const phase = useVoiceCoachSessionStore((s) => s.phase);
  const currentRep = useVoiceCoachSessionStore((s) => s.currentRep);
  const countdown = useVoiceCoachSessionStore((s) => s.countdown);
  const turbo = useVoiceCoachSessionStore((s) => s.turbo);
  const intensity = useVoiceCoachSessionStore((s) => s.intensity);
  const isPaused = useVoiceCoachSessionStore((s) => s.isPaused);
  const storeStart = useVoiceCoachSessionStore((s) => s.start);
  const stop = useVoiceCoachSessionStore((s) => s.stop);
  const pause = useVoiceCoachSessionStore((s) => s.pause);
  const resume = useVoiceCoachSessionStore((s) => s.resume);

  const start = useCallback(() => {
    if (!enabled) return;
    const config: VoiceCoachSessionConfig = {
      targetReps,
      oneMoreEnabled,
      oneMoreCount,
      repGapMs,
      prepCount,
      voicePack,
      countMode,
      flowMode,
      holdDurationSec,
      locale,
    };
    storeStart(config);
  }, [
    countMode,
    enabled,
    flowMode,
    holdDurationSec,
    locale,
    oneMoreCount,
    oneMoreEnabled,
    prepCount,
    repGapMs,
    storeStart,
    targetReps,
    voicePack,
  ]);

  useEffect(() => {
    if (!enabled && useVoiceCoachSessionStore.getState().isRunning()) {
      stop();
    }
  }, [enabled, stop]);

  return {
    phase,
    currentRep,
    countdown,
    turbo,
    intensity,
    isRunning: phase !== 'idle' && phase !== 'done',
    isPaused,
    start,
    stop,
    pause,
    resume,
  };
}
