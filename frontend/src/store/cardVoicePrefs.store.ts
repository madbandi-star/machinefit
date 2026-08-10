import { create } from 'zustand';
import type { WorkoutCardVoicePrefs } from '@machinefit/shared';
import { normalizeWorkoutCardVoicePrefs } from '@/utils/workoutCardVoicePrefs';

/**
 * Ephemeral per-card voice prefs (pickers + session snapshot).
 * Keyed by machineCode:logDate:targetMuscle — survives SPA navigation
 * within a session so template save can read unsaved card-local pickers.
 */
type CardVoicePrefsState = {
  byKey: Record<string, WorkoutCardVoicePrefs>;
  setPrefs: (key: string, prefs: WorkoutCardVoicePrefs) => void;
  getPrefs: (key: string) => WorkoutCardVoicePrefs | undefined;
  clearPrefs: (key: string) => void;
};

export const useCardVoicePrefsStore = create<CardVoicePrefsState>((set, get) => ({
  byKey: {},

  setPrefs: (key, prefs) => {
    if (!key) return;
    set((state) => ({
      byKey: {
        ...state.byKey,
        [key]: normalizeWorkoutCardVoicePrefs(prefs),
      },
    }));
  },

  getPrefs: (key) => get().byKey[key],

  clearPrefs: (key) => {
    set((state) => {
      if (!(key in state.byKey)) return state;
      const next = { ...state.byKey };
      delete next[key];
      return { byKey: next };
    });
  },
}));
