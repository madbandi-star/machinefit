import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceCountMode } from '@/utils/aiCountPace';
import { hapticCountTick } from '@/utils/haptic';
import {
  runVoiceCoachFlow,
  stopVoiceCoach,
  unlockVoiceCoachAudio,
  type VoiceCoachPhase,
} from '@/utils/voiceCoach';
import type { VoiceHoldFlowMode } from '@/utils/voiceHold';

interface UseVoiceCoachSessionOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  oneMoreCount: number;
  repGapMs: number;
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
  start: () => void;
  stop: () => void;
}

export function useVoiceCoachSession({
  targetReps,
  oneMoreEnabled,
  oneMoreCount,
  repGapMs,
  countMode,
  flowMode,
  holdDurationSec,
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

        await runVoiceCoachFlow({
          targetReps,
          oneMoreEnabled,
          maxOneMore: oneMoreCount,
          repGapMs,
          countMode,
          flowMode,
          holdDurationSec,
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
            } else if (nextPhase === 'hold') {
              setTurbo(false);
              setIntensity(detail?.holdCue ? 1 : 0.85);
              setCountdown(
                typeof detail?.countdown === 'number' ? detail.countdown : detail?.holdCue ? null : null
              );
              if (typeof detail?.countdown === 'number' && detail.countdown > 0) {
                hapticCountTick(true);
              }
            } else if (detail?.countdown != null) {
              setCountdown(detail.countdown);
            }
            if (nextPhase === 'counting') {
              const isTurbo = Boolean(detail?.turbo);
              const nextIntensity = detail?.intensity ?? 0;
              setTurbo(isTurbo);
              setIntensity(nextIntensity);
              if (detail?.rep && detail.rep > 0) {
                hapticCountTick(isTurbo);
              }
            } else if (nextPhase === 'oneMore') {
              setTurbo(false);
              setIntensity(1);
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
        // Flow already signals idle on abort; on success it ends at done.
        setPhase((prev) => (prev === 'done' ? prev : 'idle'));
        setCountdown(null);
        setTurbo(false);
        setIntensity(0);
      }
    })();
  }, [
    countMode,
    enabled,
    flowMode,
    holdDurationSec,
    locale,
    oneMoreCount,
    oneMoreEnabled,
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
