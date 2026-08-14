/**
 * Display-only exercise cards for the workout screenshot poster.
 * Volumes/set counts come from the existing report metrics.
 * Per-set rows / thumbnails are assembled from already-fetched WorkoutLog fields.
 * Does not change report math, API, or DB.
 */
import {
  formatVolumeKg,
  getEffectiveReps,
  type WorkoutDayExerciseMetric,
  type WorkoutLog,
} from '@machinefit/shared';

export type WorkoutPosterSetRow = {
  index: number;
  reps: number | null;
  loadKg: number;
};

export type WorkoutPosterExercise = {
  machineCode: string;
  machineName: string;
  muscleLabel: string | null;
  setCount: number;
  volumeKg: number;
  imageUrl: string | null;
  sets: WorkoutPosterSetRow[];
};

export type PosterRepsContext = {
  adjustedReps?: number | null;
  recommendedReps?: number | null;
};

function buildSetsForLog(
  log: WorkoutLog,
  repsCtx?: PosterRepsContext
): WorkoutPosterSetRow[] {
  const weights = Array.isArray(log.setWeightsKg) ? log.setWeightsKg : [];
  const completed = Array.isArray(log.setCompleted) ? log.setCompleted : null;
  const repsRaw = getEffectiveReps(repsCtx?.adjustedReps, repsCtx?.recommendedReps);
  const reps = repsRaw > 0 ? repsRaw : null;

  const rows: WorkoutPosterSetRow[] = [];
  const len = Math.max(weights.length, log.setCount || 0, completed?.length ?? 0);

  for (let i = 0; i < len; i += 1) {
    if (completed && completed.length === len && !completed[i]) continue;
    const load = Number(weights[i] ?? 0);
    rows.push({
      index: rows.length + 1,
      reps,
      loadKg: Number.isFinite(load) ? load : 0,
    });
  }

  if (rows.length === 0 && log.setCount > 0) {
    for (let i = 0; i < log.setCount; i += 1) {
      rows.push({
        index: i + 1,
        reps,
        loadKg: Number(weights[i] ?? 0) || 0,
      });
    }
  }

  return rows;
}

/**
 * Attach set rows / images onto report exercise metrics (report order preserved: volume desc).
 */
export function buildWorkoutPosterExercises(input: {
  exercises: WorkoutDayExerciseMetric[];
  logs: WorkoutLog[];
  repsByMachine?: Record<string, PosterRepsContext | undefined>;
  imageByMachine?: Record<string, string | null | undefined>;
  muscleLabel?: (group: string | null | undefined) => string | null;
}): WorkoutPosterExercise[] {
  const { exercises, logs, repsByMachine, imageByMachine, muscleLabel } = input;

  const logsByCode = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    const list = logsByCode.get(log.machineCode) ?? [];
    list.push(log);
    logsByCode.set(log.machineCode, list);
  }

  return exercises.map((ex) => {
    const machineLogs = logsByCode.get(ex.machineCode) ?? [];
    const sets: WorkoutPosterSetRow[] = [];
    for (const log of machineLogs) {
      const built = buildSetsForLog(log, repsByMachine?.[ex.machineCode]);
      const offset = sets.length;
      for (const row of built) {
        sets.push({ ...row, index: offset + row.index });
      }
    }

    // If logs missing set rows, synthesize placeholders from setCount (load unknown).
    if (sets.length === 0 && ex.setCount > 0) {
      for (let i = 0; i < ex.setCount; i += 1) {
        sets.push({ index: i + 1, reps: null, loadKg: 0 });
      }
    }

    return {
      machineCode: ex.machineCode,
      machineName: ex.machineName,
      muscleLabel: muscleLabel?.(ex.targetMuscleGroup) ?? null,
      setCount: ex.setCount,
      volumeKg: ex.volumeKg,
      imageUrl: imageByMachine?.[ex.machineCode] ?? null,
      sets,
    };
  });
}

export function formatPosterVolume(volumeKg: number, locale = 'ko'): string {
  return formatVolumeKg(volumeKg, locale);
}
