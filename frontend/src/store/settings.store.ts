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
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  VOICE_COACH_ONE_MORE,
  VOICE_COACH_REP_GAP,
} from '@/utils/voiceCoach';

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
  restDurationSeconds: REST_DURATION.defaultSeconds,
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
  /** Silence after each spoken rep count (ms). */
  voiceCoachRepGapMs: number;
  /** Rest between sets (seconds). Default 90 (1:30). */
  restDurationSeconds: number;
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
  setRestDurationSeconds: (seconds: number) => void;
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
      setRestDurationSeconds: (seconds) =>
        set({ restDurationSeconds: clampRestDurationSeconds(seconds) }),
      setWeightDifficulty: (value) =>
        set({ weightDifficulty: clampWeightDifficulty(value) }),
      resetSettings: () =>
        set({
          ...SETTINGS_DEFAULTS,
          timezone: getDefaultTimezone(),
        }),
    }),
    { name: 'machinefit-settings' }
  )
);
