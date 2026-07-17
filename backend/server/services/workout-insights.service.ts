import type {
  Gender,
  User,
  WorkoutInsightPeriod,
  WorkoutInsights,
  WorkoutInsightsCoaching,
  WorkoutInsightsQuery,
  WorkoutLog,
} from '@machinefit/shared';
import {
  getPeerHeightRange,
  getBoxingWeightClassRange,
  hasGrowthBodyProfile,
} from '@machinefit/shared';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

const MIN_COHORT_SAMPLE = 2;

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getPeriodRange(period: WorkoutInsightPeriod): { from: string | null; to: string } {
  const to = todayDateKey();
  if (period === 'all') return { from: null, to };

  const date = new Date();
  if (period === '30d') {
    date.setDate(date.getDate() - 30);
  } else {
    date.setMonth(date.getMonth() - 3);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return { from: `${y}-${m}-${d}`, to };
}

function sumWeights(weights: number[]): number {
  return weights.reduce((total, weight) => total + weight, 0);
}

function maxWeight(weights: number[]): number {
  return weights.length === 0 ? 0 : Math.max(...weights);
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function computeUserMetrics(logs: WorkoutLog[]) {
  if (logs.length === 0) {
    return {
      volumeGrowthPct: null as number | null,
      maxWeightKg: null as number | null,
      avgSessionVolumeKg: null as number | null,
      workoutCount: 0,
      lastSetCount: 3,
      lastMaxWeightKg: 0,
    };
  }

  const volumes = logs.map((log) => sumWeights(log.setWeightsKg));
  const firstVolume = volumes[0];
  const lastVolume = volumes[volumes.length - 1];
  const volumeGrowthPct =
    logs.length >= 2 && firstVolume > 0
      ? ((lastVolume - firstVolume) / firstVolume) * 100
      : null;

  const maxWeightKg = Math.max(...logs.flatMap((log) => log.setWeightsKg));
  const avgSessionVolumeKg = volumes.reduce((total, volume) => total + volume, 0) / volumes.length;
  const lastLog = logs[logs.length - 1];

  return {
    volumeGrowthPct,
    maxWeightKg,
    avgSessionVolumeKg,
    workoutCount: logs.length,
    lastSetCount: lastLog.setCount,
    lastMaxWeightKg: maxWeight(lastLog.setWeightsKg),
  };
}

function buildNextTarget(
  currentMaxWeightKg: number,
  setCount: number,
  referenceWeightKg?: number | null
) {
  const base =
    currentMaxWeightKg > 0
      ? currentMaxWeightKg
      : referenceWeightKg && referenceWeightKg > 0
        ? referenceWeightKg
        : 20;

  const increment = base >= 80 ? 5 : base >= 40 ? 2.5 : 2.5;
  const suggestedMaxWeightKg = roundToStep(base + increment, 2.5);
  const suggestedSetWeightsKg = Array.from({ length: setCount }, () => suggestedMaxWeightKg);

  return {
    currentMaxWeightKg: base,
    suggestedMaxWeightKg,
    suggestedSetWeightsKg,
    setCount,
  };
}

function buildCoaching(
  userMetrics: ReturnType<typeof computeUserMetrics>,
  peerAvgGrowthPct: number,
  profileAvgGrowthPct: number
): WorkoutInsightsCoaching {
  const userGrowth = userMetrics.volumeGrowthPct ?? 0;
  const relative = userGrowth - peerAvgGrowthPct;
  let comparisonLevel: WorkoutInsightsCoaching['comparisonLevel'] = 'near';

  if (relative >= 5) comparisonLevel = 'above';
  else if (relative <= -5) comparisonLevel = 'below';

  const plateau =
    userMetrics.workoutCount >= 3 &&
    userMetrics.volumeGrowthPct != null &&
    Math.abs(userMetrics.volumeGrowthPct) < 3 &&
    userMetrics.maxWeightKg != null;

  const lowFrequency = userMetrics.workoutCount < 4;

  let focus: WorkoutInsightsCoaching['focus'] = 'volume';
  if (lowFrequency) focus = 'consistency';
  else if (plateau) focus = 'intensity';
  else if (comparisonLevel === 'above') focus = 'maintain';
  else if (userGrowth < 0) focus = 'recovery';
  else if (userGrowth < profileAvgGrowthPct) focus = 'volume';

  return {
    focus,
    comparisonLevel,
    plateau,
    lowFrequency,
  };
}

function computeBodyBasedReferenceWeight(user: User & { weightKg: number; gender: Gender }): number {
  const genderFactor = user.gender === 'female' ? 0.65 : 1;
  const experienceFactor =
    {
      beginner: 0.75,
      intermediate: 1,
      advanced: 1.15,
      professional: 1.3,
    }[user.experienceLevel ?? 'intermediate'] ?? 1;

  return Math.round(user.weightKg * 0.45 * genderFactor * experienceFactor * 10) / 10;
}

function hasBodyProfile(
  user: User
): user is User & { gender: Gender; heightCm: number; weightKg: number } {
  return hasGrowthBodyProfile(user);
}

export const workoutInsightsService = {
  async getInsights(userId: string, query: WorkoutInsightsQuery): Promise<WorkoutInsights> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const machineId = await machineRepository.findIdByCode(query.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${query.machineCode}`);
    }

    const machine = await machineRepository.findByCode(query.machineCode);
    const period = query.period ?? '30d';
    const { from, to } = getPeriodRange(period);

    const logs = await workoutLogRepository.listByUser(userId, {
      machineId,
      from: from ?? undefined,
      to,
    });

    const userMetrics = computeUserMetrics(logs);
    const profileReady = hasBodyProfile(user);

    let profileAverage: WorkoutInsights['profileAverage'] = null;
    let peerComparison: WorkoutInsights['peerComparison'] = null;
    let referenceWeightKg: number | null = null;
    let bodyReferenceWeightKg: number | null = null;

    if (profileReady) {
      const { heightMinCm, heightMaxCm } = getPeerHeightRange(user.heightCm);
      const {
        weightMinKg,
        weightMaxKg,
        weightClassKey,
        isUnlimited: weightClassUnlimited,
      } = getBoxingWeightClassRange(user.gender, user.weightKg);
      bodyReferenceWeightKg = computeBodyBasedReferenceWeight(user);

      referenceWeightKg = await workoutLogRepository.getReferenceWeightKg(
        machineId,
        user.gender,
        user.experienceLevel ?? 'intermediate',
        user.heightCm
      );
      const benchmarkWeightKg = referenceWeightKg ?? bodyReferenceWeightKg;

      const profileStats = await workoutLogRepository.getCohortStats({
        machineId,
        from: from ?? '1970-01-01',
        to,
        gender: user.gender,
        heightMinCm,
        heightMaxCm,
        weightMinKg,
        weightMaxKg,
        experienceLevel: user.experienceLevel ?? undefined,
        excludeUserId: userId,
      });

      if (profileStats.sampleSize >= MIN_COHORT_SAMPLE) {
        profileAverage = {
          avgMaxWeightKg: Math.round(profileStats.avgMaxWeightKg * 10) / 10,
          avgSessionVolumeKg: Math.round(profileStats.avgSessionVolumeKg),
          avgVolumeGrowthPct: Math.round(profileStats.avgVolumeGrowthPct * 10) / 10,
          avgWorkoutCount: Math.round(profileStats.avgWorkoutCount * 10) / 10,
          sampleSize: profileStats.sampleSize,
        };
      } else if (benchmarkWeightKg) {
        profileAverage = {
          avgMaxWeightKg: benchmarkWeightKg,
          avgSessionVolumeKg: Math.round(benchmarkWeightKg * (userMetrics.lastSetCount || 3)),
          avgVolumeGrowthPct: period === '30d' ? 12 : period === '3m' ? 25 : 35,
          avgWorkoutCount: period === '30d' ? 8 : 12,
          sampleSize: 0,
        };
      }

      const peerStats = await workoutLogRepository.getCohortStats({
        machineId,
        from: from ?? '1970-01-01',
        to,
        gender: user.gender,
        heightMinCm,
        heightMaxCm,
        weightMinKg,
        weightMaxKg,
        excludeUserId: userId,
      });

      const peerAvgGrowthPct =
        peerStats.sampleSize >= MIN_COHORT_SAMPLE
          ? peerStats.avgVolumeGrowthPct
          : profileAverage?.avgVolumeGrowthPct ?? (period === '30d' ? 12 : 25);

      peerComparison = {
        userVolumeGrowthPct: userMetrics.volumeGrowthPct,
        peerAvgVolumeGrowthPct: Math.round(peerAvgGrowthPct * 10) / 10,
        relativePct:
          userMetrics.volumeGrowthPct == null
            ? null
            : Math.round((userMetrics.volumeGrowthPct - peerAvgGrowthPct) * 10) / 10,
        sampleSize: peerStats.sampleSize,
        heightMinCm,
        heightMaxCm,
        weightMinKg,
        weightMaxKg,
        weightClassKey,
        weightClassUnlimited,
        gender: user.gender,
      };
    }

    const fallbackReferenceWeightKg = referenceWeightKg ?? bodyReferenceWeightKg;

    const nextTarget =
      userMetrics.workoutCount > 0
        ? buildNextTarget(
            userMetrics.lastMaxWeightKg,
            userMetrics.lastSetCount,
            fallbackReferenceWeightKg
          )
        : fallbackReferenceWeightKg
          ? buildNextTarget(0, 3, fallbackReferenceWeightKg)
          : null;

    const coaching =
      userMetrics.workoutCount > 0 && peerComparison
        ? buildCoaching(
            userMetrics,
            peerComparison.peerAvgVolumeGrowthPct,
            profileAverage?.avgVolumeGrowthPct ?? peerComparison.peerAvgVolumeGrowthPct
          )
        : userMetrics.workoutCount > 0
          ? buildCoaching(userMetrics, 12, 12)
          : null;

    return {
      hasProfile: profileReady,
      machineCode: query.machineCode,
      machineName: machine?.name?.ko ?? machine?.name?.en ?? query.machineCode,
      period,
      userVolumeGrowthPct:
        userMetrics.volumeGrowthPct == null
          ? null
          : Math.round(userMetrics.volumeGrowthPct * 10) / 10,
      userMaxWeightKg:
        userMetrics.maxWeightKg == null ? null : Math.round(userMetrics.maxWeightKg * 10) / 10,
      userAvgSessionVolumeKg:
        userMetrics.avgSessionVolumeKg == null
          ? null
          : Math.round(userMetrics.avgSessionVolumeKg),
      userWorkoutCount: userMetrics.workoutCount,
      profileAverage,
      peerComparison,
      nextTarget,
      coaching,
    };
  },
};
