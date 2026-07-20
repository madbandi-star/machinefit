import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runVoiceCoachSession,
  stopVoiceCoach,
  type VoiceCoachPhase,
} from '@/utils/voiceCoach';

interface UseVoiceCoachSessionOptions {
  targetReps: number;
  oneMoreEnabled: boolean;
  repGapMs: number;
  locale: string;
  enabled: boolean;
}

export interface VoiceCoachSessionState {
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

export function useVoiceCoachSession({
  targetReps,
  oneMoreEnabled,
  repGapMs,
  locale,
  enabled,
}: UseVoiceCoachSessionOptions): VoiceCoachSessionState {
  const [phase, setPhase] = useState<VoiceCoachPhase>('idle');
  const [currentRep, setCurrentRep] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopVoiceCoach();
    setPhase('idle');
    setCurrentRep(0);
    setCountdown(null);
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

    void runVoiceCoachSession({
      targetReps,
      oneMoreEnabled,
      repGapMs,
      locale,
      signal: controller.signal,
      onPhaseChange: (nextPhase, detail) => {
        if (runIdRef.current !== runId) return;
        setPhase(nextPhase);
        if (detail?.rep != null) setCurrentRep(detail.rep);
        if (detail?.countdown != null) setCountdown(detail.countdown);
        if (nextPhase === 'done' || nextPhase === 'idle') {
          setCountdown(null);
        }
      },
    }).finally(() => {
      if (runIdRef.current !== runId) return;
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setPhase('idle');
      setCountdown(null);
    });
  }, [enabled, locale, oneMoreEnabled, repGapMs, targetReps]);

  useEffect(() => () => {
    abortRef.current?.abort();
    stopVoiceCoach();
  }, []);

  useEffect(() => {
    if (!enabled && abortRef.current) {
      stop();
    }
  }, [enabled, stop]);

  return {
    phase,
    currentRep,
    countdown,
    isRunning: phase !== 'idle' && phase !== 'done',
    start,
    stop,
  };
}
