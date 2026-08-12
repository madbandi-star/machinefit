import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@machinefit/shared';
import {
  DEFAULT_LOCALE,
  DEFAULT_UNIT_HEIGHT,
  DEFAULT_UNIT_WEIGHT,
  REST_DURATION,
  WEIGHT_DIFFICULTY_DEFAULT,
  clampRestDurationSeconds,
  clampToUiLocale,
  clampWeightDifficulty,
} from '@machinefit/shared';
import {
  clampVoiceCountMode,
  DEFAULT_VOICE_COUNT_MODE,
  type VoiceCountMode,
} from '@/utils/aiCountPace';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachPrepCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
  DEFAULT_VOICE_COACH_PACK,
  DEFAULT_VOICE_COACH_PREP_COUNT,
  DEFAULT_VOICE_COACH_REPS,
  isVoicePickerAllMins,
  normalizeVoiceCoachPack,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_REP_GAP,
  type VoiceCoachPack,
  type VoiceCoachPrepCount,
} from '@/utils/voiceCoach';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  DEFAULT_VOICE_HOLD_FLOW_MODE,
  VOICE_HOLD_DURATION,
  type VoiceHoldFlowMode,
} from '@/utils/voiceHold';
import {
  clampVoiceCoachVolume,
  setVoiceCoachVolumeRuntime,
  VOICE_COACH_VOLUME,
} from '@/utils/voiceCoachVolume';

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** Browser language → app UI Locale; ja/zh fall back to English. */
function detectBrowserLocale(): Locale {
  try {
    const nav = (navigator.language || navigator.languages?.[0] || '')
      .split('-')[0]
      ?.toLowerCase();
    return clampToUiLocale(nav);
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export const SETTINGS_DEFAULTS = {
  /** First visit: browser language → ko. Persist overrides after user/settings change. */
  locale: typeof navigator !== 'undefined' ? detectBrowserLocale() : DEFAULT_LOCALE,
  unitHeight: DEFAULT_UNIT_HEIGHT,
  unitWeight: DEFAULT_UNIT_WEIGHT,
  voiceCoachEnabled: true,
  /** Voice count output level 0–1 (clips, beeps, TTS). */
  voiceCoachVolume: VOICE_COACH_VOLUME.default,
  voiceCoachTargetReps: DEFAULT_VOICE_COACH_REPS,
  voiceCoachOneMore: true,
  voiceCoachOneMoreCount: VOICE_COACH_ONE_MORE.defaultCount,
  voiceCoachAutoAfterRest: true,
  voiceRestTipsEnabled: false,
  voiceCoachRepGapMs: VOICE_COACH_REP_GAP.defaultMs,
  voiceCoachPrepCount: DEFAULT_VOICE_COACH_PREP_COUNT,
  /** Korean clip pack: female | male */
  voiceCoachPack: DEFAULT_VOICE_COACH_PACK,
  voiceCountMode: DEFAULT_VOICE_COUNT_MODE,
  /** count | count_hold | hold */
  voiceCoachFlowMode: DEFAULT_VOICE_HOLD_FLOW_MODE,
  voiceHoldDurationSec: VOICE_HOLD_DURATION.defaultSec,
  restDurationSeconds: REST_DURATION.defaultSeconds,
  /** When false, skip rest timer after the final completed set. */
  restTimerAfterAllSetsComplete: true,
  /** Full-screen rest/count overlay. Default compact (소형모드) banner. */
  workoutFullscreenDisplay: false,
  weightDifficulty: WEIGHT_DIFFICULTY_DEFAULT,
} as const;

interface SettingsState {
  locale: Locale;
  unitHeight: 'cm' | 'ft_in';
  unitWeight: 'kg' | 'lb';
  timezone: string;
  voiceCoachEnabled: boolean;
  /** Voice count output level 0–1. */
  voiceCoachVolume: number;
  voiceCoachTargetReps: number;
  voiceCoachOneMore: boolean;
  /** How many "하나더" cues after target reps. */
  voiceCoachOneMoreCount: number;
  voiceCoachAutoAfterRest: boolean;
  /** Speak warnings + tips during rest between sets. */
  voiceRestTipsEnabled: boolean;
  /** Silence after each spoken rep count (ms) — base tempo for AI pacing. */
  voiceCoachRepGapMs: number;
  /** Prep countdown length: 5→1 or 10→1. */
  voiceCoachPrepCount: VoiceCoachPrepCount;
  /** Pre-recorded Korean voice pack. */
  voiceCoachPack: VoiceCoachPack;
  /** Exercise-count pacing: normal | AI accel | AI accel + turbo. */
  voiceCountMode: VoiceCountMode;
  /** Session flow: count only / count+hold / hold only. */
  voiceCoachFlowMode: VoiceHoldFlowMode;
  /** Hold ("버텨!!!") duration in seconds. */
  voiceHoldDurationSec: number;
  /** Rest between sets (seconds). Default 90 (1:30). */
  restDurationSeconds: number;
  /** Show rest timer even when every set is already completed. */
  restTimerAfterAllSetsComplete: boolean;
  /** Full-screen rest timer and voice count display during workouts. */
  workoutFullscreenDisplay: boolean;
  /** 추천 중량 배율 (0.1 = 10%, 1 = 기본, 10 = 1000%) */
  weightDifficulty: number;
  setLocale: (locale: Locale) => void;
  setUnitHeight: (unit: 'cm' | 'ft_in') => void;
  setUnitWeight: (unit: 'kg' | 'lb') => void;
  setTimezone: (tz: string) => void;
  setVoiceCoachEnabled: (enabled: boolean) => void;
  setVoiceCoachVolume: (volume: number) => void;
  setVoiceCoachTargetReps: (reps: number) => void;
  setVoiceCoachOneMore: (enabled: boolean) => void;
  setVoiceCoachOneMoreCount: (count: number) => void;
  setVoiceCoachAutoAfterRest: (enabled: boolean) => void;
  setVoiceRestTipsEnabled: (enabled: boolean) => void;
  setVoiceCoachRepGapMs: (ms: number) => void;
  setVoiceCoachPrepCount: (count: VoiceCoachPrepCount) => void;
  setVoiceCoachPack: (pack: VoiceCoachPack) => void;
  setVoiceCountMode: (mode: VoiceCountMode) => void;
  setVoiceCoachFlowMode: (mode: VoiceHoldFlowMode) => void;
  setVoiceHoldDurationSec: (seconds: number) => void;
  setRestDurationSeconds: (seconds: number) => void;
  setRestTimerAfterAllSetsComplete: (enabled: boolean) => void;
  setWorkoutFullscreenDisplay: (enabled: boolean) => void;
  setWeightDifficulty: (value: number) => void;
  /** Restore app preferences (units, voice, rest, etc.) to defaults. */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,
      timezone: getDefaultTimezone(),
      setLocale: (locale) => set({ locale: clampToUiLocale(locale) }),
      setUnitHeight: (unitHeight) => set({ unitHeight }),
      setUnitWeight: (unitWeight) => set({ unitWeight }),
      setTimezone: (timezone) => set({ timezone }),
      setVoiceCoachEnabled: (voiceCoachEnabled) => set({ voiceCoachEnabled }),
      setVoiceCoachVolume: (volume) => {
        const voiceCoachVolume = clampVoiceCoachVolume(volume);
        setVoiceCoachVolumeRuntime(voiceCoachVolume);
        set({ voiceCoachVolume });
      },
      setVoiceCoachTargetReps: (reps) =>
        set({ voiceCoachTargetReps: clampVoiceCoachTargetReps(reps) }),
      setVoiceCoachOneMore: (voiceCoachOneMore) => set({ voiceCoachOneMore }),
      setVoiceCoachOneMoreCount: (count) =>
        set({ voiceCoachOneMoreCount: clampVoiceCoachOneMoreCount(count) }),
      setVoiceCoachAutoAfterRest: (voiceCoachAutoAfterRest) => set({ voiceCoachAutoAfterRest }),
      setVoiceRestTipsEnabled: (voiceRestTipsEnabled) => set({ voiceRestTipsEnabled }),
      setVoiceCoachRepGapMs: (ms) => set({ voiceCoachRepGapMs: clampVoiceCoachRepGapMs(ms) }),
      setVoiceCoachPrepCount: (count) =>
        set({ voiceCoachPrepCount: clampVoiceCoachPrepCount(count) }),
      setVoiceCoachPack: (pack) => set({ voiceCoachPack: normalizeVoiceCoachPack(pack) }),
      setVoiceCountMode: (mode) => set({ voiceCountMode: clampVoiceCountMode(mode) }),
      setVoiceCoachFlowMode: (mode) =>
        set({ voiceCoachFlowMode: clampVoiceHoldFlowMode(mode) }),
      setVoiceHoldDurationSec: (seconds) =>
        set({ voiceHoldDurationSec: clampVoiceHoldDurationSec(seconds) }),
      setRestDurationSeconds: (seconds) =>
        set({ restDurationSeconds: clampRestDurationSeconds(seconds) }),
      setRestTimerAfterAllSetsComplete: (restTimerAfterAllSetsComplete) =>
        set({ restTimerAfterAllSetsComplete }),
      setWorkoutFullscreenDisplay: (workoutFullscreenDisplay) =>
        set({ workoutFullscreenDisplay }),
      setWeightDifficulty: (value) =>
        set({ weightDifficulty: clampWeightDifficulty(value) }),
      resetSettings: () => {
        setVoiceCoachVolumeRuntime(SETTINGS_DEFAULTS.voiceCoachVolume);
        set({
          ...SETTINGS_DEFAULTS,
          timezone: getDefaultTimezone(),
        });
      },
    }),
    {
      name: 'machinefit-settings',
      /**
       * v1: rest-tips voice default changed to off (was historically on for many installs).
       * v2: workout fullscreen display default → compact (소형모드) for count/rest.
       */
      version: 2,
      migrate: (persistedState, fromVersion) => {
        const state = (persistedState ?? {}) as Partial<SettingsState>;
        let next = { ...state };
        if (fromVersion < 1) {
          next = {
            ...next,
            voiceRestTipsEnabled: SETTINGS_DEFAULTS.voiceRestTipsEnabled,
          };
        }
        if (fromVersion < 2) {
          next = {
            ...next,
            workoutFullscreenDisplay: SETTINGS_DEFAULTS.workoutFullscreenDisplay,
          };
        }
        return next;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        // ScrollPicker mount bug used to persist all four pickers at range mins.
        const corrupted = isVoicePickerAllMins({
          targetReps: p.voiceCoachTargetReps,
          repGapMs: p.voiceCoachRepGapMs,
          oneMoreCount: p.voiceCoachOneMoreCount,
          holdDurationSec: p.voiceHoldDurationSec,
        });
        return {
          ...current,
          ...p,
          locale: clampToUiLocale(p.locale ?? current.locale),
          voiceCountMode: clampVoiceCountMode(p.voiceCountMode ?? current.voiceCountMode),
          voiceCoachPrepCount: clampVoiceCoachPrepCount(
            p.voiceCoachPrepCount ?? current.voiceCoachPrepCount
          ),
          voiceCoachPack: normalizeVoiceCoachPack(
            p.voiceCoachPack ?? current.voiceCoachPack ?? DEFAULT_VOICE_COACH_PACK
          ),
          voiceCoachFlowMode: clampVoiceHoldFlowMode(
            p.voiceCoachFlowMode ?? current.voiceCoachFlowMode
          ),
          voiceCoachVolume: clampVoiceCoachVolume(
            p.voiceCoachVolume ?? current.voiceCoachVolume ?? SETTINGS_DEFAULTS.voiceCoachVolume
          ),
          voiceCoachTargetReps: corrupted
            ? SETTINGS_DEFAULTS.voiceCoachTargetReps
            : clampVoiceCoachTargetReps(
                typeof p.voiceCoachTargetReps === 'number'
                  ? p.voiceCoachTargetReps
                  : current.voiceCoachTargetReps
              ),
          voiceCoachRepGapMs: corrupted
            ? SETTINGS_DEFAULTS.voiceCoachRepGapMs
            : clampVoiceCoachRepGapMs(p.voiceCoachRepGapMs ?? current.voiceCoachRepGapMs),
          voiceCoachOneMoreCount: corrupted
            ? SETTINGS_DEFAULTS.voiceCoachOneMoreCount
            : clampVoiceCoachOneMoreCount(
                p.voiceCoachOneMoreCount ?? current.voiceCoachOneMoreCount
              ),
          voiceHoldDurationSec: corrupted
            ? SETTINGS_DEFAULTS.voiceHoldDurationSec
            : clampVoiceHoldDurationSec(p.voiceHoldDurationSec ?? current.voiceHoldDurationSec),
          voiceRestTipsEnabled:
            typeof p.voiceRestTipsEnabled === 'boolean'
              ? p.voiceRestTipsEnabled
              : SETTINGS_DEFAULTS.voiceRestTipsEnabled,
          restTimerAfterAllSetsComplete:
            typeof p.restTimerAfterAllSetsComplete === 'boolean'
              ? p.restTimerAfterAllSetsComplete
              : (current.restTimerAfterAllSetsComplete ??
                SETTINGS_DEFAULTS.restTimerAfterAllSetsComplete),
          workoutFullscreenDisplay:
            typeof p.workoutFullscreenDisplay === 'boolean'
              ? p.workoutFullscreenDisplay
              : (current.workoutFullscreenDisplay ?? SETTINGS_DEFAULTS.workoutFullscreenDisplay),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        setVoiceCoachVolumeRuntime(state.voiceCoachVolume);
      },
    }
  )
);
