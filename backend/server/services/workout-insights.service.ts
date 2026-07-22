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
  computeDailyInsightMetrics,
  computePerformedTotalWeightKg,
  genderWeightFactor,
  getPeerHeightRange,
  getBoxingWeightClassRange,
  hasGrowthBodyProfile,
  isAllGymsId,
  nextRecommendVolumeKg,
  nextRecommendWeightKg,
} from '@machinefit/shared';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { resolveWorkoutLoadContexts, type WorkoutLoadContext } from './workout-load.service.js';
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

function maxWeight(weights: number[]): number {
  return weights.length === 0 ? 0 : Math.max(...weights);
}

function getCompletedWeights(log: WorkoutLog): number[] {
  const { setWeightsKg, setCompleted } = log;
  if (!setCompleted || setCompleted.length === 0) {
    return setWeightsKg;
  }

  return setWeightsKg.filter((_, index) => setCompleted[index] === true);
}

function sessionVolume(log: WorkoutLog, load?: WorkoutLoadContext | null): number {
  return computePerformedTotalWeightKg({
    setWeightsKg: log.setWeightsKg,
    setCompleted: log.setCompleted,
    sets: log.setCount,
    adjustedWeight: load?.adjustedWeight,
    recommendedWeight: load?.recommendedWeight,
    adjustedReps: load?.adjustedReps,
    recommendedReps: load?.recommendedReps,
  });
}

function computeUserMetrics(
  logs: WorkoutLog[],
  loadByLogId?: Map<string, WorkoutLoadContext>
) {
  const logsWithWeights = logs
    .map((log) => ({ log, weights: getCompletedWeights(log) }))
    .filter(({ weights }) => weights.length > 0);

  if (logsWithWeights.length === 0) {
    return {
      volumeGrowthPct: null as number | null,
      maxWeightKg: null as number | null,
      avgSessionVolumeKg: null as number | null,
      workoutCount: 0,
      lastSetCount: 3,
      lastMaxWeightKg: 0,
      previousMaxWeightKg: null as number | null,
      previousTotalVolumeKg: null as number | null,
    };
  }

  const volumes = logsWithWeights.map(({ log }) =>
    sessionVolume(log, loadByLogId?.get(log.id))
  );
  const firstVolume = volumes[0];
  const lastVolume = volumes[volumes.length - 1];
  const volumeGrowthPct =
    logsWithWeights.length >= 2 && firstVolume > 0
      ? ((lastVolume - firstVolume) / firstVolume) * 100
      : null;

  const maxWeightKg = Math.max(...logsWithWeights.flatMap(({ weights }) => weights));
  const avgSessionVolumeKg = volumes.reduce((total, volume) => total + volume, 0) / volumes.length;
  const lastEntry = logsWithWeights[logsWithWeights.length - 1];
  const previousEntry =
    logsWithWeights.length >= 2 ? logsWithWeights[logsWithWeights.length - 2] : null;

  return {
    volumeGrowthPct,
    maxWeightKg,
    avgSessionVolumeKg,
    workoutCount: logsWithWeights.length,
    lastSetCount: lastEntry.log.setCount,
    lastMaxWeightKg: maxWeight(lastEntry.weights),
    previousMaxWeightKg: previousEntry ? maxWeight(previousEntry.weights) : null,
    previousTotalVolumeKg: previousEntry
      ? sessionVolume(previousEntry.log, loadByLogId?.get(previousEntry.log.id))
      : null,
  };
}

function buildNextTarget(
  currentMaxWeightKg: number,
  setCount: number,
  referenceWeightKg?: number | null,
  previousMaxWeightKg?: number | null
) {
  const base =
    currentMaxWeightKg > 0
      ? currentMaxWeightKg
      : referenceWeightKg && referenceWeightKg > 0
        ? referenceWeightKg
        : 20;

  const suggestedMaxWeightKg = nextRecommendWeightKg(base);
  const suggestedSetWeightsKg = Array.from({ length: setCount }, () => suggestedMaxWeightKg);

  return {
    previousMaxWeightKg: previousMaxWeightKg ?? null,
    currentMaxWeightKg: base,
    suggestedMaxWeightKg,
    suggestedSetWeightsKg,
    setCount,
  };
}

function buildNextVolumeTarget(currentTotalVolumeKg: number, previousTotalVolumeKg?: number | null) {
  const base = currentTotalVolumeKg > 0 ? currentTotalVolumeKg : 500;
  return {
    previousTotalVolumeKg: previousTotalVolumeKg ?? null,
    currentTotalVolumeKg: Math.round(base),
    suggestedTotalVolumeKg: nextRecommendVolumeKg(base),
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
  const experienceFactor =
    {
      beginner: 0.78,
      intermediate: 1,
      advanced: 1.18,
      professional: 1.32,
    }[user.experienceLevel ?? 'intermediate'] ?? 1;

  return (
    Math.round(
      user.weightKg * 0.45 * genderWeightFactor(user.gender) * experienceFactor * 10
    ) / 10
  );
}

function hasBodyProfile(
  user: User
): user is User & { gender: Gender; heightCm: number; weightKg: number } {
  return hasGrowthBodyProfile(user);
}

export const workoutInsightsService = {
  async getInsights(userId: string, query: WorkoutInsightsQuery): Promise<WorkoutInsights> {
    if (!isAllGymsId(query.gymId)) {
      await gymScopeService.assertOwned(userId, query.gymId);
    }

    if (query.viewMode === 'daily') {
      return this.getDailyInsights(userId, query);
    }

    return this.getMachineInsights(userId, query);
  },

  async getDailyInsights(userId: string, query: WorkoutInsightsQuery): Promise<WorkoutInsights> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const period = query.period ?? '30d';
    const { from, to } = getPeriodRange(period);

    let gymIds: string[] | null | undefined;
    if (isAllGymsId(query.gymId)) {
      const resolved = await gymScopeService.resolveGymFilter(userId, query.gymId);
      gymIds = resolved.gymIds;
    }

    const logs = await workoutLogRepository.listByUser(userId, {
      gymId: query.gymId,
      gymIds,
      memberId: query.memberId,
      from: from ?? undefined,
      to,
      limit: 200,
    });

    const loadByLogId = await resolveWorkoutLoadContexts(userId, logs, {
      gymId: isAllGymsId(query.gymId) ? undefined : query.gymId,
      memberId: query.memberId,
    });
    const dailyMetrics = computeDailyInsightMetrics(logs, loadByLogId);
    const profileReady = hasBodyProfile(user);

    let profileAverage: WorkoutInsights['profileAverage'] = null;
    let peerComparison: WorkoutInsights['peerComparison'] = null;
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
      const benchmarkDailyVolume = Math.round(bodyReferenceWeightKg * 3 * 2);

      const [profileStats, peerStats] = await Promise.all([
        workoutLogRepository.getDailyCohortStats({
          from: from ?? '1970-01-01',
          to,
          gender: user.gender,
          heightMinCm,
          heightMaxCm,
          weightMinKg,
          weightMaxKg,
          experienceLevel: user.experienceLevel ?? undefined,
          excludeUserId: userId,
        }),
        workoutLogRepository.getDailyCohortStats({
          from: from ?? '1970-01-01',
          to,
          gender: user.gender,
          heightMinCm,
          heightMaxCm,
          weightMinKg,
          weightMaxKg,
          excludeUserId: userId,
        }),
      ]);

      if (profileStats.sampleSize >= MIN_COHORT_SAMPLE) {
        profileAverage = {
          avgMaxWeightKg: Math.round(profileStats.avgMaxWeightKg * 10) / 10,
          avgSessionVolumeKg: Math.round(profileStats.avgSessionVolumeKg),
          avgVolumeGrowthPct: Math.round(profileStats.avgVolumeGrowthPct * 10) / 10,
          avgWorkoutCount: Math.round(profileStats.avgWorkoutCount * 10) / 10,
          sampleSize: profileStats.sampleSize,
        };
      } else {
        profileAverage = {
          avgMaxWeightKg: bodyReferenceWeightKg,
          avgSessionVolumeKg: benchmarkDailyVolume,
          avgVolumeGrowthPct: period === '30d' ? 12 : period === '3m' ? 25 : 35,
          avgWorkoutCount: period === '30d' ? 8 : 12,
          sampleSize: 0,
        };
      }

      const peerAvgGrowthPct =
        peerStats.sampleSize >= MIN_COHORT_SAMPLE
          ? peerStats.avgVolumeGrowthPct
          : profileAverage.avgVolumeGrowthPct;

      peerComparison = {
        userVolumeGrowthPct: dailyMetrics.volumeGrowthPct,
        peerAvgVolumeGrowthPct: Math.round(peerAvgGrowthPct * 10) / 10,
        relativePct:
          dailyMetrics.volumeGrowthPct == null
            ? null
            : Math.round((dailyMetrics.volumeGrowthPct - peerAvgGrowthPct) * 10) / 10,
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

    const userMetrics = {
      volumeGrowthPct: dailyMetrics.volumeGrowthPct,
      maxWeightKg: dailyMetrics.maxWeightKg,
      avgSessionVolumeKg: dailyMetrics.avgDailyVolumeKg,
      workoutCount: dailyMetrics.workoutDayCount,
      lastSetCount: 3,
      lastMaxWeightKg: dailyMetrics.maxWeightKg ?? 0,
      previousMaxWeightKg: null as number | null,
      previousTotalVolumeKg: null as number | null,
    };

    const nextVolumeTarget =
      dailyMetrics.workoutDayCount > 0
        ? buildNextVolumeTarget(dailyMetrics.lastDailyVolumeKg)
        : profileReady && bodyReferenceWeightKg
          ? buildNextVolumeTarget(Math.round(bodyReferenceWeightKg * 3 * 2))
          : null;

    const coaching =
      dailyMetrics.workoutDayCount > 0 && peerComparison
        ? buildCoaching(
            userMetrics,
            peerComparison.peerAvgVolumeGrowthPct,
            profileAverage?.avgVolumeGrowthPct ?? peerComparison.peerAvgVolumeGrowthPct
          )
        : dailyMetrics.workoutDayCount > 0
          ? buildCoaching(userMetrics, 12, 12)
          : null;

    return {
      viewMode: 'daily',
      hasProfile: profileReady,
      period,
      userVolumeGrowthPct:
        dailyMetrics.volumeGrowthPct == null
          ? null
          : Math.round(dailyMetrics.volumeGrowthPct * 10) / 10,
      userMaxWeightKg:
        dailyMetrics.maxWeightKg == null ? null : Math.round(dailyMetrics.maxWeightKg * 10) / 10,
      userAvgSessionVolumeKg:
        dailyMetrics.avgDailyVolumeKg == null
          ? null
          : Math.round(dailyMetrics.avgDailyVolumeKg),
      userWorkoutCount: dailyMetrics.workoutDayCount,
      profileAverage,
      peerComparison,
      nextTarget: null,
      nextVolumeTarget,
      coaching,
    };
  },

  async getMachineInsights(userId: string, query: WorkoutInsightsQuery): Promise<WorkoutInsights> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

    const machineCode = query.machineCode!;
    const machine = await machineRepository.findByCode(machineCode);
    if (!machine) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    const machineId = machine.id;

    const period = query.period ?? '30d';
    const { from, to } = getPeriodRange(period);

    let gymIds: string[] | null | undefined;
    if (isAllGymsId(query.gymId)) {
      const resolved = await gymScopeService.resolveGymFilter(userId, query.gymId);
      gymIds = resolved.gymIds;
    }

    const logs = await workoutLogRepository.listByUser(userId, {
      gymId: query.gymId,
      gymIds,
      memberId: query.memberId,
      machineId,
      from: from ?? undefined,
      to,
      limit: 200,
    });

    const loadByLogId = await resolveWorkoutLoadContexts(userId, logs, {
      gymId: isAllGymsId(query.gymId) ? undefined : query.gymId,
      memberId: query.memberId,
    });
    const userMetrics = computeUserMetrics(logs, loadByLogId);
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

      const [refWeight, profileStats, peerStats] = await Promise.all([
        workoutLogRepository.getReferenceWeightKg(
          machineId,
          user.gender,
          user.experienceLevel ?? 'intermediate',
          user.heightCm
        ),
        workoutLogRepository.getCohortStats({
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
        }),
        workoutLogRepository.getCohortStats({
          machineId,
          from: from ?? '1970-01-01',
          to,
          gender: user.gender,
          heightMinCm,
          heightMaxCm,
          weightMinKg,
          weightMaxKg,
          excludeUserId: userId,
        }),
      ]);

      referenceWeightKg = refWeight;
      const benchmarkWeightKg = referenceWeightKg ?? bodyReferenceWeightKg;

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
            fallbackReferenceWeightKg,
            userMetrics.previousMaxWeightKg
          )
        : fallbackReferenceWeightKg
          ? buildNextTarget(0, 3, fallbackReferenceWeightKg, null)
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
      viewMode: 'machine',
      hasProfile: profileReady,
      machineCode,
      machineName: machine?.name?.ko ?? machine?.name?.en ?? machineCode,
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
      nextVolumeTarget: null,
      coaching,
    };
  },
};
