import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@machinefit/shared';
import {
  DEFAULT_LOCALE,
  DEFAULT_UNIT_HEIGHT,
  DEFAULT_UNIT_WEIGHT,
  WEIGHT_DIFFICULTY_DEFAULT,
  clampWeightDifficulty,
} from '@machinefit/shared';
import {
  clampVoiceCoachRepGapMs,
  VOICE_COACH_REP_GAP,
} from '@/utils/voiceCoach';

type Theme = 'light' | 'dark';

const DEFAULT_VOICE_COACH_REPS = 12;

interface SettingsState {
  locale: Locale;
  unitHeight: 'cm' | 'ft_in';
  unitWeight: 'kg' | 'lb';
  theme: Theme;
  timezone: string;
  voiceCoachEnabled: boolean;
  voiceCoachTargetReps: number;
  voiceCoachOneMore: boolean;
  voiceCoachAutoAfterRest: boolean;
  /** Speak warnings + tips during rest between sets. */
  voiceRestTipsEnabled: boolean;
  /** Silence after each spoken rep count (ms). */
  voiceCoachRepGapMs: number;
  /** 추천 중량 배율 (0.1 = 10%, 1 = 기본, 2 = 200%) */
  weightDifficulty: number;
  setLocale: (locale: Locale) => void;
  setUnitHeight: (unit: 'cm' | 'ft_in') => void;
  setUnitWeight: (unit: 'kg' | 'lb') => void;
  setTheme: (theme: Theme) => void;
  setTimezone: (tz: string) => void;
  setVoiceCoachEnabled: (enabled: boolean) => void;
  setVoiceCoachTargetReps: (reps: number) => void;
  setVoiceCoachOneMore: (enabled: boolean) => void;
  setVoiceCoachAutoAfterRest: (enabled: boolean) => void;
  setVoiceRestTipsEnabled: (enabled: boolean) => void;
  setVoiceCoachRepGapMs: (ms: number) => void;
  setWeightDifficulty: (value: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      unitHeight: DEFAULT_UNIT_HEIGHT,
      unitWeight: DEFAULT_UNIT_WEIGHT,
      theme: 'dark',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      voiceCoachEnabled: true,
      voiceCoachTargetReps: DEFAULT_VOICE_COACH_REPS,
      voiceCoachOneMore: true,
      voiceCoachAutoAfterRest: true,
      voiceRestTipsEnabled: true,
      voiceCoachRepGapMs: VOICE_COACH_REP_GAP.defaultMs,
      weightDifficulty: WEIGHT_DIFFICULTY_DEFAULT,
      setLocale: (locale) => set({ locale }),
      setUnitHeight: (unitHeight) => set({ unitHeight }),
      setUnitWeight: (unitWeight) => set({ unitWeight }),
      setTheme: (theme) => set({ theme }),
      setTimezone: (timezone) => set({ timezone }),
      setVoiceCoachEnabled: (voiceCoachEnabled) => set({ voiceCoachEnabled }),
      setVoiceCoachTargetReps: (voiceCoachTargetReps) => set({ voiceCoachTargetReps }),
      setVoiceCoachOneMore: (voiceCoachOneMore) => set({ voiceCoachOneMore }),
      setVoiceCoachAutoAfterRest: (voiceCoachAutoAfterRest) => set({ voiceCoachAutoAfterRest }),
      setVoiceRestTipsEnabled: (voiceRestTipsEnabled) => set({ voiceRestTipsEnabled }),
      setVoiceCoachRepGapMs: (ms) => set({ voiceCoachRepGapMs: clampVoiceCoachRepGapMs(ms) }),
      setWeightDifficulty: (value) =>
        set({ weightDifficulty: clampWeightDifficulty(value) }),
    }),
    { name: 'machinefit-settings' }
  )
);
