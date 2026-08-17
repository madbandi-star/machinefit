import type {
  RecommendationInput,
  WeightBasisEntry,
  WeightRecommendationBasis,
  WorkoutLog,
} from '@machinefit/shared';
import {
  EXPERIENCE_WEIGHT_MULTIPLIERS,
  computePerformedTotalWeightKg,
  estimateBodyweightLoadKg,
  getBoxingWeightClassRange,
  getPeerHeightRange,
  isBodyweightExercise,
  isFreeWeightMachineCode,
  nextBodyweightRecommendKg,
  nextRecommendWeightKg,
  normalizeWorkoutLogTargetMuscle,
  resolveBodyweightLoadFactor,
  roundRecommendWeightKg,
  snapRecommendWeightKg,
} from '@machinefit/shared';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import {
  resolveWorkoutLoadContexts,
  type WorkoutLoadContext,
} from './workout-load.service.js';

const MIN_COHORT_SAMPLE = 2;

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function roundKg(value: number): number {
  return Math.round(value);
}

/** Mirrors workoutLogRepository.getReferenceWeightKg SQL predicates in-memory. */
function referenceWeightFromSettings(
  rules: Array<{
    gender: string;
    experienceLevel: string;
    heightMinCm: number;
    heightMaxCm: number;
    weightKg?: number | null;
  }>,
  gender: string,
  experienceLevel: string,
  heightCm: number
): number | null {
  const matches = rules.filter(
    (r) =>
      r.gender === gender &&
      r.experienceLevel === experienceLevel &&
      heightCm >= r.heightMinCm &&
      heightCm <= r.heightMaxCm &&
      r.weightKg != null &&
      Number(r.weightKg) > 0
  );
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.heightMinCm - a.heightMinCm);
  const value = matches[0]?.weightKg;
  return value != null ? Number(value) : null;
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
    machineCode: log.machineCode,
    adjustedWeight: load?.adjustedWeight,
    recommendedWeight: load?.recommendedWeight,
    adjustedReps: load?.adjustedReps,
    recommendedReps: load?.recommendedReps,
    ...(load?.fitRating !== undefined ? { fitRating: load.fitRating } : {}),
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
  const avgSessionVolumeKg =
    volumes.reduce((total, volume) => total + volume, 0) / volumes.length;
  const lastEntry = logsWithWeights[logsWithWeights.length - 1];

  return {
    volumeGrowthPct,
    maxWeightKg,
    avgSessionVolumeKg,
    workoutCount: logsWithWeights.length,
    lastSetCount: lastEntry.log.setCount,
    lastMaxWeightKg: maxWeight(lastEntry.weights),
  };
}

function computeBodyBasedReferenceWeight(input: RecommendationInput): number {
  // Experience is applied only via profileFormula (+ goal personalization later).
  // Gender is applied once in applyPersonalizationToWeight (cold-start final step).
  return roundKg(input.weightKg * 0.45);
}

function computeProfileFormula(input: RecommendationInput): number {
  const multiplier = EXPERIENCE_WEIGHT_MULTIPLIERS[input.experienceLevel];
  return roundKg(input.weightKg * multiplier * 0.5);
}

function buildNextTarget(
  currentMaxWeightKg: number,
  setCount: number,
  referenceWeightKg?: number | null,
  options?: { bodyweightEstimated?: boolean }
) {
  const base =
    currentMaxWeightKg > 0
      ? currentMaxWeightKg
      : referenceWeightKg && referenceWeightKg > 0
        ? referenceWeightKg
        : options?.bodyweightEstimated
          ? 0
          : 20;

  const suggestedMaxWeightKg = options?.bodyweightEstimated
    ? nextBodyweightRecommendKg(base)
    : nextRecommendWeightKg(base);

  return {
    base,
    suggestedMaxWeightKg,
    setCount,
  };
}

/** Deduplicate cold-start blend candidates that resolve to the same kg. */
function pushUniqueCandidate(candidates: number[], value: number | null | undefined) {
  if (value == null || !(value > 0)) return;
  const key = Math.round(value * 10) / 10;
  if (candidates.some((c) => Math.round(c * 10) / 10 === key)) return;
  candidates.push(value);
}

function clampHistoryTarget(
  suggestedMaxWeightKg: number,
  profileFormula: number,
  bodyReference: number,
  lastMaxWeightKg: number,
  maxWeightKg: number | null,
  bodyweightEstimated: boolean
): number {
  const floorCandidates = [
    profileFormula * 0.85,
    bodyReference * 0.85,
    lastMaxWeightKg * 0.9,
  ].filter((value) => value > 0);
  const floor = floorCandidates.length > 0 ? Math.min(...floorCandidates) : 0;

  const capCandidates = [
    (maxWeightKg ?? 0) * 1.15,
    profileFormula * 1.5,
    lastMaxWeightKg * 1.2,
  ].filter((value) => value > 0);
  const cap =
    capCandidates.length > 0 ? Math.max(...capCandidates) : suggestedMaxWeightKg;

  return snapRecommendWeightKg(Math.min(Math.max(suggestedMaxWeightKg, floor), cap), {
    bodyweightEstimated,
  });
}

function markPrimary(entries: WeightBasisEntry[], primarySourceId: string) {
  for (const entry of entries) {
    entry.usedInFinal = entry.id === primarySourceId;
  }
}

export async function computeRecommendationWeight(options: {
  input: RecommendationInput;
  userId?: string;
  machineId: string;
  matchedSettingWeightKg?: number;
  gymId?: string;
  memberId?: string;
  machineType?: string | null;
  bodyweightLoadFactor?: number | null;
  /**
   * Already-loaded machine_settings rows for this machine.
   * When provided, reference weight is resolved in-memory (same predicates as DB).
   */
  machineSettings?: Array<{
    gender: string;
    experienceLevel: string;
    heightMinCm: number;
    heightMaxCm: number;
    weightKg?: number | null;
  }>;
}): Promise<{ recommendedWeightKg?: number; weightBasis: WeightRecommendationBasis }> {
  const {
    input,
    userId,
    machineId,
    matchedSettingWeightKg,
    gymId,
    memberId,
    machineType,
    bodyweightLoadFactor,
    machineSettings,
  } = options;
  const isBodyweight = isBodyweightExercise({
    machineCode: input.machineCode,
    machineType,
  });
  const resolvedBwFactor = isBodyweight
    ? resolveBodyweightLoadFactor({
        machineCode: input.machineCode,
        machineType,
        dbFactor: bodyweightLoadFactor,
      })
    : null;
  const bodyweightEstimatedKg = isBodyweight
    ? estimateBodyweightLoadKg(input.weightKg, resolvedBwFactor)
    : null;
  const entries: WeightBasisEntry[] = [];
  const experienceMultiplier = EXPERIENCE_WEIGHT_MULTIPLIERS[input.experienceLevel];

  entries.push({
    id: 'profileContext',
    titleKey: 'weightBasis.profileContext.title',
    descriptionKey: 'weightBasis.profileContext.description',
    params: {
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      experienceLevel: input.experienceLevel,
      ...(input.age != null ? { age: input.age } : {}),
      ...(input.workoutGoal ? { workoutGoal: input.workoutGoal } : {}),
      ...(input.targetMuscleGroup ? { targetMuscleGroup: input.targetMuscleGroup } : {}),
    },
    usedInFinal: false,
  });

  const profileFormula = computeProfileFormula(input);
  entries.push({
    id: 'profileFormula',
    titleKey: 'weightBasis.profileFormula.title',
    descriptionKey: 'weightBasis.profileFormula.description',
    params: {
      weightKg: input.weightKg,
      multiplier: experienceMultiplier,
    },
    valueKg: profileFormula,
    usedInFinal: false,
  });

  const bodyReference = computeBodyBasedReferenceWeight(input);
  entries.push({
    id: 'bodyReference',
    titleKey: 'weightBasis.bodyReference.title',
    descriptionKey: 'weightBasis.bodyReference.description',
    params: {
      weightKg: input.weightKg,
      gender: input.gender,
      experienceLevel: input.experienceLevel,
    },
    valueKg: bodyReference,
    usedInFinal: false,
  });

  if (bodyweightEstimatedKg != null && resolvedBwFactor != null) {
    entries.push({
      id: 'bodyweightEstimatedLoad',
      titleKey: 'weightBasis.bodyweightEstimatedLoad.title',
      descriptionKey: 'weightBasis.bodyweightEstimatedLoad.description',
      params: {
        weightKg: input.weightKg,
        loadFactor: resolvedBwFactor,
      },
      valueKg: bodyweightEstimatedKg,
      usedInFinal: false,
    });
  }

  if (matchedSettingWeightKg != null && matchedSettingWeightKg > 0) {
    entries.push({
      id: 'machineSettingMatch',
      titleKey: 'weightBasis.machineSettingMatch.title',
      descriptionKey: 'weightBasis.machineSettingMatch.description',
      params: {
        gender: input.gender,
        experienceLevel: input.experienceLevel,
        heightCm: input.heightCm,
      },
      valueKg: matchedSettingWeightKg,
      usedInFinal: false,
    });
  }

  const machineReferencePromise =
    machineSettings != null
      ? Promise.resolve(
          referenceWeightFromSettings(
            machineSettings,
            input.gender,
            input.experienceLevel,
            input.heightCm
          )
        )
      : workoutLogRepository.getReferenceWeightKg(
          machineId,
          input.gender,
          input.experienceLevel,
          input.heightCm
        );

  const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
    input.machineCode,
    input.targetMuscleGroup
  );

  const logsPromise =
    userId != null
      ? (async () => {
          const { userGymRepository } = await import('../repositories/user-gym.repository.js');
          const { gymScopeService } = await import('./gym-scope.service.js');
          const resolvedGymId = gymId ?? (await userGymRepository.getActiveGymId(userId));
          if (!resolvedGymId) return [] as WorkoutLog[];
          const linkScope = await gymScopeService.resolveLinkedRecordListScope(
            userId,
            memberId
          );
          return workoutLogRepository.listByUser(userId, {
            gymId: resolvedGymId,
            machineId,
            limit: 40,
            linkScope,
            ...(memberId ? { memberId } : {}),
            ...(isFreeWeightMachineCode(input.machineCode)
              ? { targetMuscleGroup: targetMuscleKey }
              : {}),
          });
        })()
      : Promise.resolve([] as WorkoutLog[]);

  const { heightMinCm, heightMaxCm } = getPeerHeightRange(input.heightCm);
  const { weightMinKg, weightMaxKg } = getBoxingWeightClassRange(
    input.gender,
    input.weightKg
  );

  // Bound cohort window — full-history scans are too expensive for every recommend.
  const cohortFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const cohortStatsPromise = workoutLogRepository.getCohortAvgMaxStats({
    machineId,
    from: cohortFrom,
    to: todayDateKey(),
    gender: input.gender,
    heightMinCm,
    heightMaxCm,
    weightMinKg,
    weightMaxKg,
    experienceLevel: input.experienceLevel,
    excludeUserId: userId,
    ...(isFreeWeightMachineCode(input.machineCode)
      ? { targetMuscleGroup: targetMuscleKey }
      : {}),
  });

  const [machineReference, logs, cohortStats] = await Promise.all([
    machineReferencePromise,
    logsPromise,
    cohortStatsPromise,
  ]);

  if (machineReference != null && machineReference > 0) {
    entries.push({
      id: 'machineReferenceDb',
      titleKey: 'weightBasis.machineReferenceDb.title',
      descriptionKey: 'weightBasis.machineReferenceDb.description',
      params: {
        gender: input.gender,
        experienceLevel: input.experienceLevel,
        heightCm: input.heightCm,
      },
      valueKg: machineReference,
      usedInFinal: false,
    });
  }

  const loadByLogId =
    userId && logs.length > 0
      ? await resolveWorkoutLoadContexts(userId, logs, { gymId, memberId })
      : undefined;
  const userMetrics = computeUserMetrics(logs, loadByLogId);

  if (userMetrics.maxWeightKg != null && userMetrics.maxWeightKg > 0) {
    entries.push({
      id: 'personalRecord',
      titleKey: 'weightBasis.personalRecord.title',
      descriptionKey: 'weightBasis.personalRecord.description',
      params: { workoutCount: userMetrics.workoutCount },
      valueKg: roundKg(userMetrics.maxWeightKg),
      usedInFinal: false,
    });
  }

  if (userMetrics.lastMaxWeightKg > 0) {
    entries.push({
      id: 'lastSessionMax',
      titleKey: 'weightBasis.lastSessionMax.title',
      descriptionKey: 'weightBasis.lastSessionMax.description',
      valueKg: roundKg(userMetrics.lastMaxWeightKg),
      usedInFinal: false,
    });
  }

  if (userMetrics.avgSessionVolumeKg != null && userMetrics.avgSessionVolumeKg > 0) {
    // Volume metric — not a working weight; keep out of valueKg to avoid UI plate-snap.
    entries.push({
      id: 'avgSessionVolume',
      titleKey: 'weightBasis.avgSessionVolume.title',
      descriptionKey: 'weightBasis.avgSessionVolume.description',
      params: {
        workoutCount: userMetrics.workoutCount,
        volumeKg: roundKg(userMetrics.avgSessionVolumeKg),
      },
      usedInFinal: false,
    });
  }

  if (userMetrics.volumeGrowthPct != null) {
    entries.push({
      id: 'volumeGrowth',
      titleKey: 'weightBasis.volumeGrowth.title',
      descriptionKey: 'weightBasis.volumeGrowth.description',
      params: { pct: roundKg(userMetrics.volumeGrowthPct) },
      usedInFinal: false,
    });
  }

  if (cohortStats.sampleSize >= MIN_COHORT_SAMPLE && cohortStats.avgMaxWeightKg > 0) {
    entries.push({
      id: 'cohortAvgMax',
      titleKey: 'weightBasis.cohortAvgMax.title',
      descriptionKey: 'weightBasis.cohortAvgMax.description',
      params: {
        sampleSize: cohortStats.sampleSize,
        heightMinCm,
        heightMaxCm,
      },
      valueKg: roundKg(cohortStats.avgMaxWeightKg),
      usedInFinal: false,
    });
  }

  const isBwEstimatedPath = bodyweightEstimatedKg != null;
  const fallbackReference =
    (isBwEstimatedPath ? bodyweightEstimatedKg : null) ??
    machineReference ??
    bodyReference ??
    matchedSettingWeightKg ??
    profileFormula;

  let primarySourceId = 'profileFormula';
  let finalWeight: number | undefined;

  if (userMetrics.workoutCount > 0 && userMetrics.lastMaxWeightKg > 0) {
    const nextTarget = buildNextTarget(
      userMetrics.lastMaxWeightKg,
      userMetrics.lastSetCount,
      fallbackReference,
      { bodyweightEstimated: isBwEstimatedPath }
    );

    entries.push({
      id: 'progressiveTarget',
      titleKey: 'weightBasis.progressiveTarget.title',
      descriptionKey: 'weightBasis.progressiveTarget.description',
      params: { baseKg: roundKg(nextTarget.base) },
      valueKg: nextTarget.suggestedMaxWeightKg,
      usedInFinal: false,
    });

    finalWeight = clampHistoryTarget(
      nextTarget.suggestedMaxWeightKg,
      profileFormula,
      bodyReference,
      userMetrics.lastMaxWeightKg,
      userMetrics.maxWeightKg,
      isBwEstimatedPath
    );
    primarySourceId = 'progressiveTarget';
  } else if (userMetrics.workoutCount > 0 && (userMetrics.maxWeightKg ?? 0) > 0) {
    const nextTarget = buildNextTarget(
      userMetrics.maxWeightKg ?? 0,
      userMetrics.lastSetCount || 3,
      fallbackReference,
      { bodyweightEstimated: isBwEstimatedPath }
    );

    entries.push({
      id: 'growthNextTarget',
      titleKey: 'weightBasis.growthNextTarget.title',
      descriptionKey: 'weightBasis.growthNextTarget.description',
      params: { baseKg: roundKg(nextTarget.base) },
      valueKg: nextTarget.suggestedMaxWeightKg,
      usedInFinal: false,
    });

    // Same floor/cap as progressive so growth/progressive stay consistent.
    finalWeight = clampHistoryTarget(
      nextTarget.suggestedMaxWeightKg,
      profileFormula,
      bodyReference,
      userMetrics.maxWeightKg ?? 0,
      userMetrics.maxWeightKg,
      isBwEstimatedPath
    );
    primarySourceId = 'growthNextTarget';
  } else if (bodyweightEstimatedKg != null) {
    // Bodyweight cold-start: bodyweight × factor (no plate snap / blend).
    finalWeight = bodyweightEstimatedKg;
    primarySourceId = 'bodyweightEstimatedLoad';
  } else {
    const candidates: number[] = [];
    pushUniqueCandidate(candidates, profileFormula);
    pushUniqueCandidate(candidates, bodyReference);
    // Prefer live match over duplicate exact-band reference when equal.
    pushUniqueCandidate(candidates, matchedSettingWeightKg);
    pushUniqueCandidate(candidates, machineReference);

    if (cohortStats.sampleSize >= MIN_COHORT_SAMPLE && cohortStats.avgMaxWeightKg > 0) {
      pushUniqueCandidate(candidates, cohortStats.avgMaxWeightKg);
    }

    if (candidates.length === 0) {
      finalWeight = undefined;
      primarySourceId = 'profileContext';
    } else if (candidates.length === 1) {
      finalWeight = roundRecommendWeightKg(candidates[0]);
      if (candidates[0] === profileFormula) primarySourceId = 'profileFormula';
      else if (candidates[0] === bodyReference) primarySourceId = 'bodyReference';
      else if (candidates[0] === matchedSettingWeightKg) primarySourceId = 'machineSettingMatch';
      else if (candidates[0] === machineReference) primarySourceId = 'machineReferenceDb';
      else primarySourceId = 'cohortAvgMax';
    } else {
      const blended = candidates.reduce((total, value) => total + value, 0) / candidates.length;
      finalWeight = roundRecommendWeightKg(blended);

      entries.push({
        id: 'blendedSelection',
        titleKey: 'weightBasis.blendedSelection.title',
        descriptionKey: 'weightBasis.blendedSelection.description',
        params: { count: candidates.length },
        valueKg: finalWeight,
        usedInFinal: true,
      });
      primarySourceId = 'blendedSelection';
    }
  }

  if (primarySourceId !== 'blendedSelection') {
    markPrimary(entries, primarySourceId);
  }

  const normalizedFinalWeight =
    finalWeight == null
      ? undefined
      : snapRecommendWeightKg(finalWeight, {
          bodyweightEstimated:
            primarySourceId === 'bodyweightEstimatedLoad' || isBwEstimatedPath,
        });

  return {
    recommendedWeightKg: normalizedFinalWeight,
    weightBasis: {
      entries,
      finalWeightKg: normalizedFinalWeight,
      primarySourceId,
    },
  };
}
