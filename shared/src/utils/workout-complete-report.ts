import { computePerformedTotalWeightKg } from './effective-load.js';
import { formatVolumeKg } from './lifted-volume.js';
import type { WorkoutLog } from '../types/workout.types.js';
import type {
  WorkoutCompleteReport,
  WorkoutDayExerciseMetric,
  WorkoutDayMvp,
  WorkoutDayNewRecord,
  WorkoutDayProgress,
  WorkoutDaySummaryMetrics,
  WorkoutOneLinerKey,
} from '../types/workout-complete.types.js';

const LOWER_MUSCLES = new Set([
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'legs',
  'lower_body',
  'hips',
]);

const UPPER_MUSCLES = new Set([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'arms',
  'upper_body',
  'lats',
  'traps',
]);

export interface LogVolumeContext {
  adjustedWeight?: number | null;
  recommendedWeight?: number | null;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
}

function countPerformedSets(log: WorkoutLog): number {
  if (Array.isArray(log.setCompleted) && log.setCompleted.length > 0) {
    return log.setCompleted.filter(Boolean).length;
  }
  if (log.setCount > 0) return log.setCount;
  return Array.isArray(log.setWeightsKg) ? log.setWeightsKg.length : 0;
}

export function volumeKgForLog(log: WorkoutLog, ctx?: LogVolumeContext): number {
  return computePerformedTotalWeightKg({
    setWeightsKg: log.setWeightsKg,
    setCompleted: log.setCompleted,
    sets: log.setCount,
    adjustedWeight: ctx?.adjustedWeight,
    recommendedWeight: ctx?.recommendedWeight,
    adjustedReps: ctx?.adjustedReps,
    recommendedReps: ctx?.recommendedReps,
    machineCode: log.machineCode,
  });
}

export function buildExerciseMetrics(
  logs: WorkoutLog[],
  contexts?: Record<string, LogVolumeContext | undefined>
): WorkoutDayExerciseMetric[] {
  const byCode = new Map<string, WorkoutDayExerciseMetric>();

  for (const log of logs) {
    const volumeKg = volumeKgForLog(log, contexts?.[log.machineCode]);
    const setCount = countPerformedSets(log);
    const existing = byCode.get(log.machineCode);
    const name = log.machineName?.trim() || log.machineCode;
    if (existing) {
      existing.setCount += setCount;
      existing.volumeKg += volumeKg;
      if (!existing.targetMuscleGroup && log.targetMuscleGroup) {
        existing.targetMuscleGroup = log.targetMuscleGroup;
      }
    } else {
      byCode.set(log.machineCode, {
        machineCode: log.machineCode,
        machineName: name,
        setCount,
        volumeKg,
        targetMuscleGroup: log.targetMuscleGroup ?? null,
      });
    }
  }

  return [...byCode.values()].sort((a, b) => b.volumeKg - a.volumeKg);
}

export function buildDaySummaryMetrics(input: {
  dateKey: string;
  durationMs: number;
  logs: WorkoutLog[];
  contexts?: Record<string, LogVolumeContext | undefined>;
}): WorkoutDaySummaryMetrics {
  const exercises = buildExerciseMetrics(input.logs, input.contexts);
  return {
    dateKey: input.dateKey,
    durationMs: Math.max(0, Math.floor(input.durationMs)),
    exerciseCount: exercises.length,
    setCount: exercises.reduce((sum, e) => sum + e.setCount, 0),
    totalVolumeKg: exercises.reduce((sum, e) => sum + e.volumeKg, 0),
    exercises,
  };
}

export function selectWorkoutMvp(
  summary: WorkoutDaySummaryMetrics,
  locale = 'ko'
): WorkoutDayMvp | null {
  if (summary.exercises.length === 0) return null;

  const byVolume = [...summary.exercises].sort((a, b) => b.volumeKg - a.volumeKg)[0];
  const bySets = [...summary.exercises].sort((a, b) => b.setCount - a.setCount)[0];

  if (byVolume.volumeKg > 0) {
    return {
      kind: 'volume',
      machineCode: byVolume.machineCode,
      machineName: byVolume.machineName,
      valueLabel: `${formatVolumeKg(byVolume.volumeKg, locale)} kg`,
      reasonKey: 'volume',
    };
  }

  if (bySets.setCount > 0) {
    return {
      kind: 'sets',
      machineCode: bySets.machineCode,
      machineName: bySets.machineName,
      valueLabel: String(bySets.setCount),
      reasonKey: 'sets',
    };
  }

  return null;
}

/** Best prior-day volume per machine (excluding today). */
export function detectBestNewRecord(
  todayExercises: WorkoutDayExerciseMetric[],
  priorByMachine: Record<string, number>
): WorkoutDayNewRecord | null {
  let best: WorkoutDayNewRecord | null = null;

  for (const ex of todayExercises) {
    if (ex.volumeKg <= 0) continue;
    const previousBestKg = priorByMachine[ex.machineCode] ?? 0;
    if (previousBestKg <= 0) continue;
    if (ex.volumeKg <= previousBestKg) continue;
    const deltaKg = ex.volumeKg - previousBestKg;
    if (!best || deltaKg > best.deltaKg) {
      best = {
        machineCode: ex.machineCode,
        machineName: ex.machineName,
        todayVolumeKg: ex.volumeKg,
        previousBestKg,
        deltaKg,
      };
    }
  }

  return best;
}

export function computeVolumeProgress(
  todayVolumeKg: number,
  priorDayVolumes: number[]
): WorkoutDayProgress | null {
  const days = priorDayVolumes.filter((v) => v > 0);
  if (todayVolumeKg <= 0 || days.length < 2) return null;
  const avg = days.reduce((a, b) => a + b, 0) / days.length;
  if (avg <= 0) return null;
  const vsAvgPercent = Math.round(((todayVolumeKg - avg) / avg) * 100);
  return {
    vsAvgPercent,
    avgVolumeKg: Math.round(avg),
    todayVolumeKg: Math.round(todayVolumeKg),
  };
}

function muscleBias(exercises: WorkoutDayExerciseMetric[]): 'lower' | 'upper' | 'mixed' {
  let lower = 0;
  let upper = 0;
  for (const ex of exercises) {
    const g = (ex.targetMuscleGroup ?? '').toLowerCase();
    if (LOWER_MUSCLES.has(g)) lower += ex.volumeKg || ex.setCount;
    else if (UPPER_MUSCLES.has(g)) upper += ex.volumeKg || ex.setCount;
  }
  if (lower === 0 && upper === 0) return 'mixed';
  if (lower > upper * 1.25) return 'lower';
  if (upper > lower * 1.25) return 'upper';
  return 'mixed';
}

export function selectOneLinerKey(input: {
  summary: WorkoutDaySummaryMetrics;
  newRecord: WorkoutDayNewRecord | null;
  daysSincePreviousWorkout: number | null;
}): WorkoutOneLinerKey {
  const { summary, newRecord, daysSincePreviousWorkout } = input;

  if (newRecord) return 'new_record';
  if (daysSincePreviousWorkout != null && daysSincePreviousWorkout >= 7) return 'comeback';
  if (summary.durationMs >= 90 * 60_000) return 'long_session';
  if (summary.setCount >= 30) return 'high_sets';
  if (summary.totalVolumeKg >= 10_000) return 'high_volume';
  if (summary.totalVolumeKg > 0 && summary.totalVolumeKg < 1_500 && summary.setCount <= 8) {
    return 'light';
  }

  const bias = muscleBias(summary.exercises);
  if (bias === 'lower') return 'lower_body';
  if (bias === 'upper') return 'upper_body';
  if (summary.totalVolumeKg >= 5_000) return 'high_volume';
  return 'default';
}

export function formatWorkoutDurationCompact(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m`;
  return `${totalSec}s`;
}

export function formatWorkoutDateDots(dateKey: string): string {
  const [y, m, d] = dateKey.split('-');
  if (!y || !m || !d) return dateKey;
  return `${y}.${m}.${d}`;
}

/** Aggregate prior logs into best volume per machine and per-day totals. */
export function aggregatePriorVolumes(
  logs: WorkoutLog[],
  todayKey: string,
  contexts?: Record<string, LogVolumeContext | undefined>
): {
  bestByMachine: Record<string, number>;
  dayTotals: number[];
  lastWorkoutDateKey: string | null;
} {
  const dayTotalsMap = new Map<string, number>();
  const dayMachineMap = new Map<string, number>();

  for (const log of logs) {
    const day = log.logDate?.slice(0, 10);
    if (!day || day === todayKey) continue;
    const vol = volumeKgForLog(log, contexts?.[log.machineCode]);
    dayTotalsMap.set(day, (dayTotalsMap.get(day) ?? 0) + vol);
    const mk = `${day}::${log.machineCode}`;
    dayMachineMap.set(mk, (dayMachineMap.get(mk) ?? 0) + vol);
  }

  const bestByMachine: Record<string, number> = {};
  for (const [key, vol] of dayMachineMap) {
    const code = key.split('::')[1];
    if (!code) continue;
    bestByMachine[code] = Math.max(bestByMachine[code] ?? 0, vol);
  }

  const days = [...dayTotalsMap.keys()].sort();
  return {
    bestByMachine,
    dayTotals: [...dayTotalsMap.values()],
    lastWorkoutDateKey: days.length ? days[days.length - 1]! : null,
  };
}

export function daysBetweenKeys(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const a = Date.UTC(fy, (fm ?? 1) - 1, fd ?? 1);
  const b = Date.UTC(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((b - a) / 86_400_000);
}

export function buildWorkoutCompleteReport(input: {
  dateKey: string;
  durationMs: number;
  todayLogs: WorkoutLog[];
  priorLogs: WorkoutLog[];
  contexts?: Record<string, LogVolumeContext | undefined>;
  power: { balance: number; earnedToday: number } | null;
  locale?: string;
}): WorkoutCompleteReport {
  const summary = buildDaySummaryMetrics({
    dateKey: input.dateKey,
    durationMs: input.durationMs,
    logs: input.todayLogs,
    contexts: input.contexts,
  });
  const prior = aggregatePriorVolumes(input.priorLogs, input.dateKey, input.contexts);
  const newRecord = detectBestNewRecord(summary.exercises, prior.bestByMachine);
  const progress =
    newRecord == null
      ? computeVolumeProgress(summary.totalVolumeKg, prior.dayTotals)
      : null;
  const daysSince =
    prior.lastWorkoutDateKey != null
      ? daysBetweenKeys(prior.lastWorkoutDateKey, input.dateKey)
      : null;
  const oneLinerKey = selectOneLinerKey({
    summary,
    newRecord,
    daysSincePreviousWorkout: daysSince,
  });

  return {
    event: 'WORKOUT_COMPLETED',
    completedAt: new Date().toISOString(),
    dateKey: input.dateKey,
    summary,
    power: input.power,
    mvp: selectWorkoutMvp(summary, input.locale ?? 'ko'),
    newRecord,
    progress,
    oneLinerKey,
    shareTextKey: oneLinerKey,
  };
}

// Re-export type for consumers that need the mvp shape after selection
export type { WorkoutDayMvp };
