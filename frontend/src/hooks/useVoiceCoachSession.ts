import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceCountMode } from '@/utils/aiCountPace';
import { hapticCountTick } from '@/utils/haptic';
import { speechManager } from '@/utils/speechManager';
import {
  runVoiceCoachFlow,
  stopVoiceCoach,
  unlockVoiceCoachAudio,
  type VoiceCoachPack,
  type VoiceCoachPhase,
  type VoiceCoachPrepCount,
} from '@/utils/voiceCoach';
import { ensureVoiceCoachAudioRunning, stopVoiceCoachClips } from '@/utils/voiceCoachClips';
import {
  setActiveVoiceCoachPause,
  VoiceCoachPauseController,
} from '@/utils/voiceCoachPause';
import type { VoiceHoldFlowMode } from '@/utils/voiceHold';

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
  const [phase, setPhase] = useState<VoiceCoachPhase>('idle');
  const [currentRep, setCurrentRep] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef<VoiceCoachPauseController | null>(null);
  const runIdRef = useRef(0);

  const clearPauseController = useCallback(() => {
    pauseRef.current?.resume();
    if (pauseRef.current) {
      setActiveVoiceCoachPause(null);
    }
    pauseRef.current = null;
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearPauseController();
    stopVoiceCoach();
    setPhase('idle');
    setCurrentRep(0);
    setCountdown(null);
    setTurbo(false);
    setIntensity(0);
  }, [clearPauseController]);

  const pause = useCallback(() => {
    if (!abortRef.current || pauseRef.current?.isPaused) return;
    const controller = pauseRef.current;
    if (!controller) return;
    controller.pause();
    // Soft silence only — do not bump session generation (that would kill the run).
    speechManager.cancel();
    stopVoiceCoachClips();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (!pauseRef.current?.isPaused) return;
    pauseRef.current.resume();
    setIsPaused(false);
    void ensureVoiceCoachAudioRunning();
  }, []);

  const start = useCallback(() => {
    if (!enabled) return;

    // Soft-stop prior run, but keep media warm for this tap / rest auto-start.
    abortRef.current?.abort();
    clearPauseController();
    stopVoiceCoach({ keepAudioSession: true });

    const controller = new AbortController();
    abortRef.current = controller;
    const pauseController = new VoiceCoachPauseController();
    pauseRef.current = pauseController;
    setActiveVoiceCoachPause(pauseController);
    setIsPaused(false);
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    setPhase('beep');
    setCurrentRep(0);
    setCountdown(null);
    setTurbo(false);
    setIntensity(0);

    // Sync unlock in the click turn (prime + gesture resume), then start flow.
    // First Start on recommendation/history must work before any set-complete.
    const unlockPromise = unlockVoiceCoachAudio(voicePack);

    void (async () => {
      try {
        // Wait for gesture-initiated AudioContext resume / keep-alive — not clips.
        // 120ms was too short when resume was slow → beeps/clips played suspended
        // (silent first tap; second tap worked because context was already running).
        await Promise.race([
          unlockPromise,
          new Promise<void>((resolve) => window.setTimeout(resolve, 500)),
        ]);
        // Belt-and-suspenders: await the gesture resume promise before first sound.
        await ensureVoiceCoachAudioRunning();
        if (controller.signal.aborted || runIdRef.current !== runId) return;

        await runVoiceCoachFlow({
          targetReps,
          oneMoreEnabled,
          maxOneMore: oneMoreCount,
          repGapMs,
          prepCount,
          voicePack,
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
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('[voiceCoach] session failed', error);
        }
      } finally {
        if (runIdRef.current !== runId) return;
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        if (pauseRef.current === pauseController) {
          clearPauseController();
        }
        // Flow already signals idle on abort; on success it ends at done.
        setPhase((prev) => (prev === 'done' ? prev : 'idle'));
        setCountdown(null);
        setTurbo(false);
        setIntensity(0);
      }
    })();
  }, [
    clearPauseController,
    countMode,
    enabled,
    flowMode,
    holdDurationSec,
    locale,
    oneMoreCount,
    oneMoreEnabled,
    prepCount,
    repGapMs,
    targetReps,
    voicePack,
  ]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      clearPauseController();
      stopVoiceCoach();
    },
    [clearPauseController]
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
    isPaused,
    start,
    stop,
    pause,
    resume,
  };
}
