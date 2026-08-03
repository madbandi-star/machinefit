import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** UI shell only — does not change workout/recommendation business data. */
export type AppUiMode = 'normal' | 'easy';

interface EasyModeState {
  mode: AppUiMode;
  setMode: (mode: AppUiMode) => void;
}

/**
 * Isolated from settings/auth stores so normal-mode state shape stays unchanged.
 * Default is always normal (current product UI).
 */
export const useEasyModeStore = create<EasyModeState>()(
  persist(
    (set) => ({
      mode: 'normal',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'machinefit-easy-mode' }
  )
);
