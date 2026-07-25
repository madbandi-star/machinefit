import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceCountMode } from '@/utils/aiCountPace';
import { hapticCountTick } from '@/utils/haptic';
import {
  runVoiceCoachSession,
  stopVoiceCoach,
  unlockVoiceCoachAudio,
  type VoiceCoachPhase,
  type VoiceCoachPrepCount,
} from '@/utils/voiceCoach';

interface UseVoiceCoachSessionOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  oneMoreCount: number;
  repGapMs: number;
  prepCount: VoiceCoachPrepCount;
  countMode: VoiceCountMode;
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
  start: () => void;
  stop: () => void;
}

export function useVoiceCoachSession({
  targetReps,
  oneMoreEnabled,
  oneMoreCount,
  repGapMs,
  prepCount,
  countMode,
  locale,
  enabled,
}: UseVoiceCoachSessionOptions): VoiceCoachSessionState {
  const [phase, setPhase] = useState<VoiceCoachPhase>('idle');
  const [currentRep, setCurrentRep] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopVoiceCoach();
    setPhase('idle');
    setCurrentRep(0);
    setCountdown(null);
    setTurbo(false);
    setIntensity(0);
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;

    abortRef.current?.abort();
    stopVoiceCoach();

    const controller = new AbortController();
    abortRef.current = controller;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    setPhase('beep');
    setCurrentRep(0);
    setCountdown(null);
    setTurbo(false);
    setIntensity(0);

    void (async () => {
      try {
        // Await unlock inside the tap turn so mobile keeps Web Audio / HTMLAudio alive.
        await unlockVoiceCoachAudio();
        if (controller.signal.aborted || runIdRef.current !== runId) return;

        await runVoiceCoachSession({
          targetReps,
          oneMoreEnabled,
          maxOneMore: oneMoreCount,
          repGapMs,
          prepCount,
          countMode,
          locale,
          signal: controller.signal,
          onPhaseChange: (nextPhase, detail) => {
            if (runIdRef.current !== runId) return;
            setPhase(nextPhase);
            if (detail?.rep != null) setCurrentRep(detail.rep);
            if (nextPhase === 'countdown') {
              setCountdown(typeof detail?.countdown === 'number' ? detail.countdown : null);
              setTurbo(false);
              setIntensity(0);
            } else if (detail?.countdown != null) {
              setCountdown(detail.countdown);
            }
            if (nextPhase === 'counting' || nextPhase === 'oneMore') {
              const isTurbo = Boolean(detail?.turbo);
              const nextIntensity = detail?.intensity ?? (nextPhase === 'oneMore' ? 1 : 0);
              setTurbo(isTurbo);
              setIntensity(nextIntensity);
              if (detail?.rep && detail.rep > 0) {
                hapticCountTick(isTurbo);
              }
            }
            if (nextPhase === 'done' || nextPhase === 'idle') {
              setCountdown(null);
              setTurbo(false);
              setIntensity(0);
            }
          },
        });
      } finally {
        if (runIdRef.current !== runId) return;
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        // runVoiceCoachSession already signals idle on abort; on success it ends at done.
        setPhase((prev) => (prev === 'done' ? prev : 'idle'));
        setCountdown(null);
        setTurbo(false);
        setIntensity(0);
      }
    })();
  }, [
    countMode,
    enabled,
    locale,
    oneMoreCount,
    oneMoreEnabled,
    prepCount,
    repGapMs,
    targetReps,
  ]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopVoiceCoach();
    },
    []
  );

  useEffect(() => {
    if (!enabled && abortRef.current) {
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
    start,
    stop,
  };
}
