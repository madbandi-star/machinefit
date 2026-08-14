import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutCompleteReport, WorkoutLog } from '@machinefit/shared';
import type { PosterRepsContext } from '@/utils/workoutPosterExerciseDetails';

export type WorkoutPosterSource = {
  todayLogs: WorkoutLog[];
  repsByMachine?: Record<string, PosterRepsContext | undefined>;
};

type WorkoutCompleteUiState = {
  confirmOpen: boolean;
  reportOpen: boolean;
  completing: boolean;
  report: WorkoutCompleteReport | null;
  /** In-memory only — set rows for screenshot poster. */
  posterSource: WorkoutPosterSource | null;
  lastCompletedDateKey: string | null;
  openConfirm: () => void;
  closeConfirm: () => void;
  setCompleting: (value: boolean) => void;
  beginReport: () => void;
  openReport: (report: WorkoutCompleteReport, posterSource?: WorkoutPosterSource | null) => void;
  closeReport: () => void;
};

export const useWorkoutCompleteStore = create<WorkoutCompleteUiState>()(
  persist(
    (set) => ({
      confirmOpen: false,
      reportOpen: false,
      completing: false,
      report: null,
      posterSource: null,
      lastCompletedDateKey: null,

      openConfirm: () => set({ confirmOpen: true }),
      closeConfirm: () => set({ confirmOpen: false }),
      setCompleting: (value) => set({ completing: value }),
      beginReport: () => set({ confirmOpen: false, reportOpen: true }),
      openReport: (report, posterSource = null) =>
        set({
          confirmOpen: false,
          reportOpen: true,
          completing: false,
          report,
          posterSource,
          lastCompletedDateKey: report.dateKey,
        }),
      closeReport: () => set({ reportOpen: false, posterSource: null }),
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
