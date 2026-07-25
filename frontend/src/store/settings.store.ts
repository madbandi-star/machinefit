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
  DEFAULT_VOICE_COACH_PACK,
  DEFAULT_VOICE_COACH_PREP_COUNT,
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

const DEFAULT_VOICE_COACH_REPS = 12;

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export const SETTINGS_DEFAULTS = {
  locale: DEFAULT_LOCALE,
  unitHeight: DEFAULT_UNIT_HEIGHT,
  unitWeight: DEFAULT_UNIT_WEIGHT,
  voiceCoachEnabled: true,
  voiceCoachTargetReps: DEFAULT_VOICE_COACH_REPS,
  voiceCoachOneMore: true,
  voiceCoachOneMoreCount: VOICE_COACH_ONE_MORE.defaultCount,
  voiceCoachAutoAfterRest: true,
  voiceRestTipsEnabled: true,
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
  weightDifficulty: WEIGHT_DIFFICULTY_DEFAULT,
} as const;

interface SettingsState {
  locale: Locale;
  unitHeight: 'cm' | 'ft_in';
  unitWeight: 'kg' | 'lb';
  timezone: string;
  voiceCoachEnabled: boolean;
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
  /** 추천 중량 배율 (0.1 = 10%, 1 = 기본, 10 = 1000%) */
  weightDifficulty: number;
  setLocale: (locale: Locale) => void;
  setUnitHeight: (unit: 'cm' | 'ft_in') => void;
  setUnitWeight: (unit: 'kg' | 'lb') => void;
  setTimezone: (tz: string) => void;
  setVoiceCoachEnabled: (enabled: boolean) => void;
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
  setWeightDifficulty: (value: number) => void;
  /** Restore app preferences (units, voice, rest, etc.) to defaults. */
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,
      timezone: getDefaultTimezone(),
      setLocale: (locale) => set({ locale }),
      setUnitHeight: (unitHeight) => set({ unitHeight }),
      setUnitWeight: (unitWeight) => set({ unitWeight }),
      setTimezone: (timezone) => set({ timezone }),
      setVoiceCoachEnabled: (voiceCoachEnabled) => set({ voiceCoachEnabled }),
      setVoiceCoachTargetReps: (voiceCoachTargetReps) => set({ voiceCoachTargetReps }),
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
      setWeightDifficulty: (value) =>
        set({ weightDifficulty: clampWeightDifficulty(value) }),
      resetSettings: () =>
        set({
          ...SETTINGS_DEFAULTS,
          timezone: getDefaultTimezone(),
        }),
    }),
    {
      name: 'machinefit-settings',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
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
          voiceHoldDurationSec: clampVoiceHoldDurationSec(
            p.voiceHoldDurationSec ?? current.voiceHoldDurationSec
          ),
          restTimerAfterAllSetsComplete:
            typeof p.restTimerAfterAllSetsComplete === 'boolean'
              ? p.restTimerAfterAllSetsComplete
              : (current.restTimerAfterAllSetsComplete ??
                SETTINGS_DEFAULTS.restTimerAfterAllSetsComplete),
        };
      },
    }
  )
);
