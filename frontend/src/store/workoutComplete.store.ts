import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutCompleteReport } from '@machinefit/shared';

type WorkoutCompleteUiState = {
  confirmOpen: boolean;
  reportOpen: boolean;
  completing: boolean;
  report: WorkoutCompleteReport | null;
  lastCompletedDateKey: string | null;
  openConfirm: () => void;
  closeConfirm: () => void;
  setCompleting: (value: boolean) => void;
  beginReport: () => void;
  openReport: (report: WorkoutCompleteReport) => void;
  closeReport: () => void;
};

export const useWorkoutCompleteStore = create<WorkoutCompleteUiState>()(
  persist(
    (set) => ({
      confirmOpen: false,
      reportOpen: false,
      completing: false,
      report: null,
      lastCompletedDateKey: null,

      openConfirm: () => set({ confirmOpen: true }),
      closeConfirm: () => set({ confirmOpen: false }),
      setCompleting: (value) => set({ completing: value }),
      beginReport: () => set({ confirmOpen: false, reportOpen: true }),
      openReport: (report) =>
        set({
          confirmOpen: false,
          reportOpen: true,
          completing: false,
          report,
          lastCompletedDateKey: report.dateKey,
        }),
      closeReport: () => set({ reportOpen: false }),
    }),
    {
      name: 'machinefit-workout-complete',
      partialize: (s) => ({
        report: s.report,
        lastCompletedDateKey: s.lastCompletedDateKey,
      }),
    }
  )
);
