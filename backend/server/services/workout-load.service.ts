import type { RecommendationSettings, WorkoutLog } from '@machinefit/shared';
import { computePerformedTotalWeightKg } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { preferenceRepository } from '../repositories/preference.repository.js';

export interface WorkoutLoadContext {
  adjustedWeight?: number | null;
  recommendedWeight?: number | null;
  adjustedReps?: number | null;
  recommendedReps?: number | null;
}

function repsFromSettings(settings?: Partial<RecommendationSettings> | null): number | null {
  if (!settings) return null;
  if (settings.recommendedRepsMin != null && settings.recommendedRepsMin > 0) {
    return settings.recommendedRepsMin;
  }
  if (settings.recommendedRepsMax != null && settings.recommendedRepsMax > 0) {
    return settings.recommendedRepsMax;
  }
  return null;
}

function parseJsonSettings(value: unknown): Partial<RecommendationSettings> {
  if (!value || typeof value !== 'object') return {};
  return value as Partial<RecommendationSettings>;
}

/**
 * Batch-resolve adjusted (preferences) + recommended (recommendation snapshot)
 * load fields for workout logs so total weight uses adjusted-first rules.
 */
export async function resolveWorkoutLoadContexts(
  userId: string,
  logs: WorkoutLog[],
  options?: { gymId?: string; memberId?: string }
): Promise<Map<string, WorkoutLoadContext>> {
  const result = new Map<string, WorkoutLoadContext>();
  if (logs.length === 0) return result;

  const machineCodes = [...new Set(logs.map((log) => log.machineCode).filter(Boolean))];
  const recommendationIds = [
    ...new Set(
      logs
        .map((log) => log.recommendationId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const preferencesByMachine: Record<string, Partial<RecommendationSettings>> = {};
  if (options?.gymId && options?.memberId && machineCodes.length > 0) {
    try {
      const batch = await preferenceRepository.findByUserMachineCodes(
        userId,
        machineCodes,
        { gymId: options.gymId, memberId: options.memberId }
      );
      for (const code of machineCodes) {
        preferencesByMachine[code] = batch[code]?.customSettings ?? {};
      }
    } catch {
      // Soft-fail: fall back to recommended-only.
    }
  }

  const recommendationById = new Map<
    string,
    { recommendedWeightKg?: number; recommendedRepsMin?: number; recommendedRepsMax?: number }
  >();

  const pool = getPool();
  if (pool && recommendationIds.length > 0) {
    const recResult = await pool.query<{
      id: string;
      recommended_weight_kg: string | null;
      recommended_reps_min: number | null;
      recommended_reps_max: number | null;
    }>(
      `SELECT id, recommended_weight_kg, recommended_reps_min, recommended_reps_max
       FROM machine_recommendations
       WHERE id = ANY($1::uuid[])`,
      [recommendationIds]
    );

    for (const row of recResult.rows) {
      recommendationById.set(row.id, {
        recommendedWeightKg: row.recommended_weight_kg
          ? parseFloat(row.recommended_weight_kg)
          : undefined,
        recommendedRepsMin: row.recommended_reps_min ?? undefined,
        recommendedRepsMax: row.recommended_reps_max ?? undefined,
      });
    }
  }

  for (const log of logs) {
    const adjusted = preferencesByMachine[log.machineCode] ?? {};
    const recommended = log.recommendationId
      ? recommendationById.get(log.recommendationId)
      : undefined;

    result.set(log.id, {
      adjustedWeight: adjusted.recommendedWeightKg,
      recommendedWeight: recommended?.recommendedWeightKg,
      adjustedReps: repsFromSettings(adjusted),
      recommendedReps: repsFromSettings(recommended ?? null),
    });
  }

  return result;
}

export function computeLogTotalWeightKg(
  log: WorkoutLog,
  load?: WorkoutLoadContext | null
): number {
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

export function sumLogsTotalWeightKg(
  logs: WorkoutLog[],
  loadByLogId?: Map<string, WorkoutLoadContext>
): number {
  return logs.reduce(
    (sum, log) => sum + computeLogTotalWeightKg(log, loadByLogId?.get(log.id)),
    0
  );
}

export { parseJsonSettings, repsFromSettings };
