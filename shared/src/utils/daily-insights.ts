import type { WorkoutLog } from '../types/workout.types.js';

export interface DailyInsightMetrics {
  volumeGrowthPct: number | null;
  maxWeightKg: number | null;
  avgDailyVolumeKg: number | null;
  workoutDayCount: number;
  lastDailyVolumeKg: number;
}

function sumWeights(weights: number[]): number {
  return weights.reduce((total, weight) => total + weight, 0);
}

function maxWeight(weights: number[]): number {
  return weights.length === 0 ? 0 : Math.max(...weights);
}

function normalizeLogDate(logDate: string): string {
  return logDate.slice(0, 10);
}

export function computeDailyInsightMetrics(logs: WorkoutLog[]): DailyInsightMetrics {
  if (logs.length === 0) {
    return {
      volumeGrowthPct: null,
      maxWeightKg: null,
      avgDailyVolumeKg: null,
      workoutDayCount: 0,
      lastDailyVolumeKg: 0,
    };
  }

  const byDate = new Map<string, { totalVolume: number; peakSetWeight: number }>();

  for (const log of logs) {
    const logDate = normalizeLogDate(log.logDate);
    const day = byDate.get(logDate) ?? { totalVolume: 0, peakSetWeight: 0 };
    day.totalVolume += sumWeights(log.setWeightsKg);
    day.peakSetWeight = Math.max(day.peakSetWeight, maxWeight(log.setWeightsKg));
    byDate.set(logDate, day);
  }

  const dailyVolumes = [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, day]) => day.totalVolume);
  const dailyPeaks = [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, day]) => day.peakSetWeight);

  const firstVolume = dailyVolumes[0];
  const lastVolume = dailyVolumes[dailyVolumes.length - 1];

  return {
    volumeGrowthPct:
      dailyVolumes.length >= 2 && firstVolume > 0
        ? ((lastVolume - firstVolume) / firstVolume) * 100
        : null,
    maxWeightKg: dailyPeaks.length > 0 ? Math.max(...dailyPeaks) : null,
    avgDailyVolumeKg:
      dailyVolumes.reduce((total, volume) => total + volume, 0) / dailyVolumes.length,
    workoutDayCount: dailyVolumes.length,
    lastDailyVolumeKg: lastVolume,
  };
}
