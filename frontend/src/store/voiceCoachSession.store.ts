import { create } from 'zustand';
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
import { publishCountLockScreen } from '@/utils/workoutLockScreen';

function publishLiveCountLockScreen(
  state: Pick<
    VoiceCoachSessionState,
    'phase' | 'currentRep' | 'countdown' | 'turbo' | 'intensity' | 'isPaused'
  >
): void {
  if (state.phase === 'idle' || state.phase === 'done') return;
  publishCountLockScreen({
    phase: state.phase,
    currentRep: state.currentRep,
    countdown: state.countdown,
    turbo: state.turbo,
    intensity: state.intensity,
    isPaused: state.isPaused,
  });
}

export type CountDisplayOverride = 'auto' | 'compact' | 'full';

export interface VoiceCoachSessionConfig {
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
}

interface VoiceCoachSessionState {
  phase: VoiceCoachPhase;
  currentRep: number;
  countdown: number | null;
  turbo: boolean;
  intensity: number;
  isPaused: boolean;
  displayOverride: CountDisplayOverride;
  sessionId: number | null;
  config: VoiceCoachSessionConfig | null;
  start: (config: VoiceCoachSessionConfig) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setDisplayOverride: (mode: CountDisplayOverride) => void;
  minimize: () => void;
  expand: () => void;
  isRunning: () => boolean;
}

let sessionCounter = 0;
let abortController: AbortController | null = null;
let pauseController: VoiceCoachPauseController | null = null;
let runId = 0;

function clearPauseController(setPaused: (paused: boolean) => void): void {
  pauseController?.resume();
  if (pauseController) {
    setActiveVoiceCoachPause(null);
  }
  pauseController = null;
  setPaused(false);
}

function resetLiveFields(): Pick<
  VoiceCoachSessionState,
  'phase' | 'currentRep' | 'countdown' | 'turbo' | 'intensity' | 'isPaused' | 'sessionId' | 'config' | 'displayOverride'
> {
  return {
    phase: 'idle',
    currentRep: 0,
    countdown: null,
    turbo: false,
    intensity: 0,
    isPaused: false,
    sessionId: null,
    config: null,
    displayOverride: 'auto',
  };
}

export const useVoiceCoachSessionStore = create<VoiceCoachSessionState>((set, get) => ({
  phase: 'idle',
  currentRep: 0,
  countdown: null,
  turbo: false,
  intensity: 0,
  isPaused: false,
  displayOverride: 'auto',
  sessionId: null,
  config: null,

  isRunning: () => {
    const { phase } = get();
    return phase !== 'idle' && phase !== 'done';
  },

  setDisplayOverride: (displayOverride) => set({ displayOverride }),
  minimize: () => set({ displayOverride: 'compact' }),
  expand: () => set({ displayOverride: 'full' }),

  stop: () => {
    abortController?.abort();
    abortController = null;
    clearPauseController((isPaused) => set({ isPaused }));
    stopVoiceCoach();
    set(resetLiveFields());
  },

  pause: () => {
    if (!abortController || pauseController?.isPaused) return;
    if (!pauseController) return;
    pauseController.pause();
    speechManager.cancel();
    stopVoiceCoachClips();
    set({ isPaused: true });
    publishLiveCountLockScreen({ ...get(), isPaused: true });
  },

  resume: () => {
    if (!pauseController?.isPaused) return;
    pauseController.resume();
    set({ isPaused: false });
    void ensureVoiceCoachAudioRunning();
    publishLiveCountLockScreen({ ...get(), isPaused: false });
  },

  start: (config) => {
    abortController?.abort();
    clearPauseController((isPaused) => set({ isPaused }));
    stopVoiceCoach({ keepAudioSession: true });

    const controller = new AbortController();
    abortController = controller;
    const nextPause = new VoiceCoachPauseController();
    pauseController = nextPause;
    setActiveVoiceCoachPause(nextPause);

    sessionCounter += 1;
    const thisRun = runId + 1;
    runId = thisRun;
    const thisSessionId = sessionCounter;

    set({
      phase: 'beep',
      currentRep: 0,
      countdown: null,
      turbo: false,
      intensity: 0,
      isPaused: false,
      sessionId: thisSessionId,
      config,
      // Fresh start uses displayOverride "auto" → compact unless user expands to full.
      displayOverride: 'auto',
    });

    const unlockPromise = unlockVoiceCoachAudio(config.voicePack);

    void (async () => {
      try {
        await Promise.race([
          unlockPromise,
          new Promise<void>((resolve) => window.setTimeout(resolve, 500)),
        ]);
        await ensureVoiceCoachAudioRunning();
        if (controller.signal.aborted || runId !== thisRun) return;

        await runVoiceCoachFlow({
          targetReps: config.targetReps,
          oneMoreEnabled: config.oneMoreEnabled,
          maxOneMore: config.oneMoreCount,
          repGapMs: config.repGapMs,
          prepCount: config.prepCount,
          voicePack: config.voicePack,
          countMode: config.countMode,
          flowMode: config.flowMode,
          holdDurationSec: config.holdDurationSec,
          locale: config.locale,
          signal: controller.signal,
          onPhaseChange: (nextPhase, detail) => {
            if (runId !== thisRun) return;
            const patch: Partial<VoiceCoachSessionState> = { phase: nextPhase };
            if (detail?.rep != null) patch.currentRep = detail.rep;
            if (nextPhase === 'countdown') {
              patch.countdown = typeof detail?.countdown === 'number' ? detail.countdown : null;
              patch.turbo = false;
              patch.intensity = 0;
            } else if (nextPhase === 'hold') {
              patch.turbo = false;
              patch.intensity = detail?.holdCue ? 1 : 0.85;
              patch.countdown =
                typeof detail?.countdown === 'number' ? detail.countdown : null;
              if (typeof detail?.countdown === 'number' && detail.countdown > 0) {
                hapticCountTick(true);
              }
            } else if (detail?.countdown != null) {
              patch.countdown = detail.countdown;
            }
            if (nextPhase === 'counting' || nextPhase === 'oneMore') {
              const isTurbo = Boolean(detail?.turbo);
              const nextIntensity = detail?.intensity ?? (nextPhase === 'oneMore' ? 1 : 0);
              patch.turbo = isTurbo;
              patch.intensity = nextIntensity;
              if (detail?.rep && detail.rep > 0) {
                hapticCountTick(isTurbo);
              }
            }
            if (nextPhase === 'done' || nextPhase === 'idle') {
              patch.countdown = null;
              patch.turbo = false;
              patch.intensity = 0;
            }
            set(patch);
            const live = { ...get(), ...patch };
            publishLiveCountLockScreen(live);
          },
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('[voiceCoach] session failed', error);
        }
      } finally {
        if (runId !== thisRun) return;
        if (abortController === controller) {
          abortController = null;
        }
        if (pauseController === nextPause) {
          clearPauseController((isPaused) => set({ isPaused }));
        }
        const prev = get().phase;
        set({
          phase: prev === 'done' ? prev : 'idle',
          countdown: null,
          turbo: false,
          intensity: 0,
          sessionId: null,
          config: null,
          displayOverride: 'auto',
          isPaused: false,
        });
      }
    })();
  },
}));
