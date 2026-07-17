import type {
  Gender,
  User,
  WorkoutInsightPeriod,
  WorkoutInsights,
  WorkoutLog,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { ApiResponse } from '@machinefit/shared';
import {
  computeMachineKpis,
  computeVolumeGrowthPct,
  getSessionsForMachine,
  type GrowthPeriod,
} from '@/utils/workoutAnalytics';

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function estimateReferenceWeight(user: User): number {
  const bodyWeight = user.weightKg ?? 70;
  const genderFactor = user.gender === 'female' ? 0.65 : 1;
  const experienceFactor =
    {
      beginner: 0.75,
      intermediate: 1,
      advanced: 1.15,
      professional: 1.3,
    }[user.experienceLevel ?? 'intermediate'] ?? 1;

  return round1(bodyWeight * 0.45 * genderFactor * experienceFactor);
}

function buildLocalInsights(
  user: User,
  machineCode: string,
  machineName: string | undefined,
  period: WorkoutInsightPeriod,
  logs: WorkoutLog[]
): WorkoutInsights {
  const sessions = getSessionsForMachine(logs, machineCode);
  const kpis = computeMachineKpis(sessions);
  const hasProfile = Boolean(user.gender && user.heightCm && user.heightCm >= 100);

  const benchmarkGrowth = period === '30d' ? 12 : period === '3m' ? 25 : 35;
  const referenceWeight = estimateReferenceWeight(user);
  const lastSession = sessions[sessions.length - 1];
  const setCount = lastSession?.setCount ?? 3;
  const currentMax = kpis.currentPr ?? referenceWeight;
  const increment = currentMax >= 80 ? 5 : 2.5;
  const suggestedMax = Math.round((currentMax + increment) / 2.5) * 2.5;

  const profileAverage = hasProfile
    ? {
        avgMaxWeightKg: referenceWeight,
        avgSessionVolumeKg: Math.round(referenceWeight * setCount),
        avgVolumeGrowthPct: benchmarkGrowth,
        avgWorkoutCount: period === '30d' ? 8 : 12,
        sampleSize: 0,
      }
    : null;

  const userGrowth = computeVolumeGrowthPct(sessions);

  return {
    hasProfile,
    machineCode,
    machineName,
    period,
    userVolumeGrowthPct: userGrowth == null ? null : round1(userGrowth),
    userMaxWeightKg: kpis.currentPr == null ? null : round1(kpis.currentPr),
    userAvgSessionVolumeKg:
      sessions.length === 0
        ? null
        : Math.round(
            sessions.reduce((total, session) => total + session.totalVolume, 0) / sessions.length
          ),
    userWorkoutCount: kpis.workoutCount,
    profileAverage,
    peerComparison: hasProfile
      ? {
          userVolumeGrowthPct: userGrowth == null ? null : round1(userGrowth),
          peerAvgVolumeGrowthPct: benchmarkGrowth,
          relativePct: userGrowth == null ? null : round1(userGrowth - benchmarkGrowth),
          sampleSize: 0,
          heightMinCm: (user.heightCm ?? 170) - 5,
          heightMaxCm: (user.heightCm ?? 170) + 5,
          gender: user.gender as Gender,
        }
      : null,
    nextTarget:
      sessions.length > 0 || hasProfile
        ? {
            currentMaxWeightKg: round1(currentMax),
            suggestedMaxWeightKg: suggestedMax,
            suggestedSetWeightsKg: Array.from({ length: setCount }, () => suggestedMax),
            setCount,
          }
        : null,
    coaching:
      sessions.length > 0
        ? {
            focus:
              kpis.workoutCount < 4
                ? 'consistency'
                : (userGrowth ?? 0) >= benchmarkGrowth
                  ? 'maintain'
                  : 'volume',
            comparisonLevel:
              (userGrowth ?? 0) >= benchmarkGrowth + 5
                ? 'above'
                : (userGrowth ?? 0) <= benchmarkGrowth - 5
                  ? 'below'
                  : 'near',
            plateau:
              userGrowth != null && Math.abs(userGrowth) < 3 && kpis.workoutCount >= 3,
            lowFrequency: kpis.workoutCount < 4,
          }
        : null,
  };
}

export async function fetchWorkoutInsights(options: {
  machineCode: string;
  period: GrowthPeriod;
  user: User | null;
  logs: WorkoutLog[];
  machineName?: string;
}): Promise<WorkoutInsights | null> {
  if (!options.machineCode) return null;

  try {
    const res = await apiClient.get<ApiResponse<WorkoutInsights>>('/workout-logs/insights', {
      params: {
        machineCode: options.machineCode,
        period: options.period,
      },
    });
    return res.data.data ?? null;
  } catch {
    if (!options.user) return null;
    return buildLocalInsights(
      options.user,
      options.machineCode,
      options.machineName,
      options.period,
      options.logs
    );
  }
}
