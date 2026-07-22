import type {
  Gender,
  User,
  WorkoutInsightPeriod,
  WorkoutInsights,
  WorkoutInsightViewMode,
  WorkoutLog,
  TargetMuscleGroup,
} from '@machinefit/shared';
import {
  computeDailyInsightMetrics,
  getPeerHeightRange,
  getBoxingWeightClassRange,
  hasGrowthBodyProfile,
  nextRecommendVolumeKg,
  nextRecommendWeightKg,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { ApiResponse } from '@machinefit/shared';
import {
  computeMachineKpis,
  computeVolumeGrowthPct,
  getSessionsForMachine,
  type GrowthPeriod,
} from '@/utils/workoutAnalytics';

function mapToInsightPeriod(
  period: GrowthPeriod,
  customFrom?: string,
  customTo?: string
): WorkoutInsightPeriod {
  if (period !== 'custom') return period;
  if (!customFrom || !customTo) return '30d';

  const [fy, fm, fd] = customFrom.split('-').map(Number);
  const [ty, tm, td] = customTo.split('-').map(Number);
  const fromDate = new Date(fy, fm - 1, fd);
  const toDate = new Date(ty, tm - 1, td);
  const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);

  if (days <= 35) return '30d';
  if (days <= 100) return '3m';
  return 'all';
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function estimateReferenceWeight(user: User & { weightKg: number }): number {
  const genderFactor = user.gender === 'female' ? 0.65 : 1;
  const experienceFactor =
    {
      beginner: 0.75,
      intermediate: 1,
      advanced: 1.15,
      professional: 1.3,
    }[user.experienceLevel ?? 'intermediate'] ?? 1;

  return round1(user.weightKg * 0.45 * genderFactor * experienceFactor);
}

function buildPeerComparison(
  user: User,
  userGrowth: number | null,
  benchmarkGrowth: number
): WorkoutInsights['peerComparison'] {
  const { heightMinCm, heightMaxCm } = getPeerHeightRange(user.heightCm!);
  const {
    weightMinKg,
    weightMaxKg,
    weightClassKey,
    isUnlimited: weightClassUnlimited,
  } = getBoxingWeightClassRange(user.gender, user.weightKg!);

  return {
    userVolumeGrowthPct: userGrowth == null ? null : round1(userGrowth),
    peerAvgVolumeGrowthPct: benchmarkGrowth,
    relativePct: userGrowth == null ? null : round1(userGrowth - benchmarkGrowth),
    sampleSize: 0,
    heightMinCm,
    heightMaxCm,
    weightMinKg,
    weightMaxKg,
    weightClassKey,
    weightClassUnlimited,
    gender: user.gender as Gender,
  };
}

function buildLocalMachineInsights(
  user: User,
  machineCode: string,
  machineName: string | undefined,
  period: WorkoutInsightPeriod,
  logs: WorkoutLog[],
  targetMuscleGroup?: TargetMuscleGroup
): WorkoutInsights {
  const sessions = getSessionsForMachine(logs, machineCode, targetMuscleGroup);
  const kpis = computeMachineKpis(sessions);
  const hasProfile = hasGrowthBodyProfile(user);

  const benchmarkGrowth = period === '30d' ? 12 : period === '3m' ? 25 : 35;
  const referenceWeight = hasProfile ? estimateReferenceWeight(user as User & { weightKg: number }) : 0;
  const lastSession = sessions[sessions.length - 1];
  const setCount = lastSession?.setCount ?? 3;
  const currentMax = kpis.currentPr ?? referenceWeight;
  const suggestedMax = nextRecommendWeightKg(currentMax);

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
    viewMode: 'machine',
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
    peerComparison: hasProfile ? buildPeerComparison(user, userGrowth, benchmarkGrowth) : null,
    nextTarget:
      sessions.length > 0 || hasProfile
        ? {
            currentMaxWeightKg: Math.round(currentMax),
            suggestedMaxWeightKg: suggestedMax,
            suggestedSetWeightsKg: Array.from({ length: setCount }, () => suggestedMax),
            setCount,
          }
        : null,
    nextVolumeTarget: null,
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

function buildLocalDailyInsights(
  user: User,
  period: WorkoutInsightPeriod,
  logs: WorkoutLog[]
): WorkoutInsights {
  const dailyMetrics = computeDailyInsightMetrics(logs);
  const hasProfile = hasGrowthBodyProfile(user);
  const benchmarkGrowth = period === '30d' ? 12 : period === '3m' ? 25 : 35;
  const referenceWeight = hasProfile ? estimateReferenceWeight(user as User & { weightKg: number }) : 0;
  const benchmarkDailyVolume = Math.round(referenceWeight * 3 * 2);

  const profileAverage = hasProfile
    ? {
        avgMaxWeightKg: referenceWeight,
        avgSessionVolumeKg: benchmarkDailyVolume,
        avgVolumeGrowthPct: benchmarkGrowth,
        avgWorkoutCount: period === '30d' ? 8 : 12,
        sampleSize: 0,
      }
    : null;

  const userGrowth = dailyMetrics.volumeGrowthPct;
  const currentVolume =
    dailyMetrics.lastDailyVolumeKg > 0 ? dailyMetrics.lastDailyVolumeKg : benchmarkDailyVolume;

  return {
    viewMode: 'daily',
    hasProfile,
    period,
    userVolumeGrowthPct: userGrowth == null ? null : round1(userGrowth),
    userMaxWeightKg:
      dailyMetrics.maxWeightKg == null ? null : round1(dailyMetrics.maxWeightKg),
    userAvgSessionVolumeKg:
      dailyMetrics.avgDailyVolumeKg == null
        ? null
        : Math.round(dailyMetrics.avgDailyVolumeKg),
    userWorkoutCount: dailyMetrics.workoutDayCount,
    profileAverage,
    peerComparison: hasProfile ? buildPeerComparison(user, userGrowth, benchmarkGrowth) : null,
    nextTarget: null,
    nextVolumeTarget:
      dailyMetrics.workoutDayCount > 0 || hasProfile
        ? {
            currentTotalVolumeKg: Math.round(currentVolume),
            suggestedTotalVolumeKg: nextRecommendVolumeKg(currentVolume),
          }
        : null,
    coaching:
      dailyMetrics.workoutDayCount > 0
        ? {
            focus:
              dailyMetrics.workoutDayCount < 4
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
              userGrowth != null && Math.abs(userGrowth) < 3 && dailyMetrics.workoutDayCount >= 3,
            lowFrequency: dailyMetrics.workoutDayCount < 4,
          }
        : null,
  };
}

export async function fetchWorkoutInsights(options: {
  gymId: string;
  memberId: string;
  viewMode: WorkoutInsightViewMode;
  machineCode?: string;
  targetMuscleGroup?: TargetMuscleGroup;
  period: GrowthPeriod;
  customFrom?: string;
  customTo?: string;
  user: User | null;
  logs: WorkoutLog[];
  machineName?: string;
}): Promise<WorkoutInsights | null> {
  if (options.viewMode === 'machine' && !options.machineCode) return null;

  const insightPeriod = mapToInsightPeriod(options.period, options.customFrom, options.customTo);

  if (options.viewMode === 'machine' && options.targetMuscleGroup) {
    if (!options.user) return null;
    return buildLocalMachineInsights(
      options.user,
      options.machineCode!,
      options.machineName,
      insightPeriod,
      options.logs,
      options.targetMuscleGroup
    );
  }

  try {
    const res = await apiClient.get<ApiResponse<WorkoutInsights>>('/workout-logs/insights', {
      params:
        options.viewMode === 'daily'
          ? {
              gymId: options.gymId,
              memberId: options.memberId,
              viewMode: 'daily',
              period: insightPeriod,
            }
          : {
              gymId: options.gymId,
              memberId: options.memberId,
              viewMode: 'machine',
              machineCode: options.machineCode,
              period: insightPeriod,
            },
    });
    return res.data.data ?? null;
  } catch {
    if (!options.user) return null;
    if (options.viewMode === 'daily') {
      return buildLocalDailyInsights(options.user, insightPeriod, options.logs);
    }
    return buildLocalMachineInsights(
      options.user,
      options.machineCode!,
      options.machineName,
      insightPeriod,
      options.logs
    );
  }
}
