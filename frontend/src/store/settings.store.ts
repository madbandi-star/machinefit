import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@machinefit/shared';
import {
  DEFAULT_LOCALE,
  DEFAULT_UNIT_HEIGHT,
  DEFAULT_UNIT_WEIGHT,
} from '@machinefit/shared';

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
    }),
    { name: 'machinefit-settings' }
  )
);
