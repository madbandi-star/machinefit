import { create } from 'zustand';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
} from '@/utils/voiceCoach';
import { clampVoiceHoldDurationSec } from '@/utils/voiceHold';

export type HomeVoicePickerValues = {
  targetReps: number;
  repGapMs: number;
  oneMoreCount: number;
  holdDurationSec: number;
  voiceEnabled: boolean;
};

type HomeVoiceToolsState = {
  /**
   * Once the user edits home 횟수세기 pickers, values stay in this store
   * across SPA navigation and no longer follow Settings defaults.
   */
  customized: boolean;
  pickersPinned: boolean;
  pickers: HomeVoicePickerValues | null;
  setPickersPinned: (pinned: boolean) => void;
  /** First edit (or later edits): snapshot + patch; ignored while pinned. */
  updatePickers: (
    current: HomeVoicePickerValues,
    patch: Partial<HomeVoicePickerValues>
  ) => void;
  /** Reset home overrides back to the provided Settings defaults. */
  resetToDefaults: (defaults: HomeVoicePickerValues) => void;
};

function clampPickers(values: HomeVoicePickerValues): HomeVoicePickerValues {
  return {
    targetReps: clampVoiceCoachTargetReps(values.targetReps),
    repGapMs: clampVoiceCoachRepGapMs(values.repGapMs),
    oneMoreCount: clampVoiceCoachOneMoreCount(values.oneMoreCount),
    holdDurationSec: clampVoiceHoldDurationSec(values.holdDurationSec),
    voiceEnabled: values.voiceEnabled,
  };
}

export const useHomeVoiceToolsStore = create<HomeVoiceToolsState>((set, get) => ({
  customized: false,
  pickersPinned: true,
  pickers: null,

  setPickersPinned: (pinned) => set({ pickersPinned: pinned }),

  updatePickers: (current, patch) => {
    if (get().pickersPinned) return;
    const base = get().pickers ?? current;
    set({
      customized: true,
      pickers: clampPickers({ ...base, ...patch }),
    });
  },

  resetToDefaults: (defaults) =>
    set({
      customized: false,
      pickersPinned: true,
      pickers: clampPickers(defaults),
    }),
}));
