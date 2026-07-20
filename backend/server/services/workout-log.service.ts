import type { UpsertWorkoutLogInput, WorkoutLogListQuery, DeleteWorkoutLogInput, Locale } from '@machinefit/shared';
import { isFreeWeightMachineCode, normalizeWorkoutLogTargetMuscle } from '@machinefit/shared';
import { workoutLogRepository } from '../repositories/workout-log.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const workoutLogService = {
  async list(userId: string, query: WorkoutLogListQuery, locale: Locale = 'en') {
    let machineId: string | undefined;
    if (query.machineCode) {
      const foundId = await machineRepository.findIdByCode(query.machineCode);
      if (!foundId) {
        throw new AppError(404, 'NOT_FOUND', `Machine not found: ${query.machineCode}`);
      }
      machineId = foundId;
    }

    const targetMuscleGroup =
      query.machineCode && query.targetMuscleGroup !== undefined
        ? normalizeWorkoutLogTargetMuscle(query.machineCode, query.targetMuscleGroup)
        : undefined;

    return workoutLogRepository.listByUser(userId, {
      machineId,
      logDate: query.logDate,
      from: query.from,
      to: query.to,
      targetMuscleGroup,
    }, locale);
  },

  async upsert(userId: string, input: UpsertWorkoutLogInput) {
    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
      input.machineCode,
      input.targetMuscleGroup
    );

    if (isFreeWeightMachineCode(input.machineCode) && !targetMuscleKey) {
      throw new AppError(400, 'VALIDATION_ERROR', 'targetMuscleGroup is required for free-weight logs');
    }

    const logDate = input.logDate ?? todayDateKey();

    try {
      return await workoutLogRepository.upsert(userId, machineId, {
        recommendationId: input.recommendationId,
        logDate,
        targetMuscleGroup: targetMuscleKey,
        setCount: input.setCount,
        setWeightsKg: input.setWeightsKg,
        setCompleted: input.setCompleted,
        diary: input.diary,
      });
    } catch (error) {
      const pgCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (pgCode === '23505') {
        throw new AppError(
          409,
          'DUPLICATE_LOG',
          'A workout log already exists for this machine, date, and target muscle'
        );
      }
      throw error;
    }
  },

  async remove(userId: string, input: DeleteWorkoutLogInput) {
    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const targetMuscleKey = normalizeWorkoutLogTargetMuscle(
      input.machineCode,
      input.targetMuscleGroup
    );

    if (isFreeWeightMachineCode(input.machineCode) && !targetMuscleKey) {
      throw new AppError(400, 'VALIDATION_ERROR', 'targetMuscleGroup is required for free-weight logs');
    }

    const deleted = await workoutLogRepository.deleteByUserMachineDate(
      userId,
      machineId,
      input.logDate,
      targetMuscleKey
    );

    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Workout log not found');
    }
  },
};
