import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@machinefit/shared';
import {
  DEFAULT_LOCALE,
  DEFAULT_UNIT_HEIGHT,
  DEFAULT_UNIT_WEIGHT,
} from '@machinefit/shared';

type Theme = 'light' | 'dark';

interface SettingsState {
  locale: Locale;
  unitHeight: 'cm' | 'ft_in';
  unitWeight: 'kg' | 'lb';
  theme: Theme;
  timezone: string;
  setLocale: (locale: Locale) => void;
  setUnitHeight: (unit: 'cm' | 'ft_in') => void;
  setUnitWeight: (unit: 'kg' | 'lb') => void;
  setTheme: (theme: Theme) => void;
  setTimezone: (tz: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      unitHeight: DEFAULT_UNIT_HEIGHT,
      unitWeight: DEFAULT_UNIT_WEIGHT,
      theme: 'dark',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      setLocale: (locale) => set({ locale }),
      setUnitHeight: (unitHeight) => set({ unitHeight }),
      setUnitWeight: (unitWeight) => set({ unitWeight }),
      setTheme: (theme) => set({ theme }),
      setTimezone: (timezone) => set({ timezone }),
    }),
    { name: 'machinefit-settings' }
  )
);
