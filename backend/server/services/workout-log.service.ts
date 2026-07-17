import type { UpsertWorkoutLogInput, WorkoutLogListQuery } from '@machinefit/shared';
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
  async list(userId: string, query: WorkoutLogListQuery) {
    const machineId = await machineRepository.findIdByCode(query.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${query.machineCode}`);
    }

    return workoutLogRepository.listByUser(userId, {
      machineId,
      logDate: query.logDate,
      from: query.from,
      to: query.to,
    });
  },

  async upsert(userId: string, input: UpsertWorkoutLogInput) {
    const machineId = await machineRepository.findIdByCode(input.machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${input.machineCode}`);
    }

    const logDate = input.logDate ?? todayDateKey();

    return workoutLogRepository.upsert(userId, machineId, {
      recommendationId: input.recommendationId,
      logDate,
      setCount: input.setCount,
      setWeightsKg: input.setWeightsKg,
    });
  },
};
