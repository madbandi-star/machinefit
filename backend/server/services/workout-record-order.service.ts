import type {
  ReorderWorkoutRecordCardsInput,
  WorkoutRecordDisplayOrderQuery,
} from '@machinefit/shared';
import { normalizeWorkoutLogTargetMuscle, isFreeWeightMachineCode } from '@machinefit/shared';
import { machineRepository } from '../repositories/machine.repository.js';
import { workoutRecordOrderRepository } from '../repositories/workout-record-order.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export const workoutRecordOrderService = {
  async list(userId: string, query: WorkoutRecordDisplayOrderQuery) {
    await gymScopeService.resolveMemberForWrite(userId, query.gymId, query.memberId);
    return workoutRecordOrderRepository.listByScope(
      userId,
      query.gymId,
      query.memberId,
      query.logDate
    );
  },

  async reorder(userId: string, input: ReorderWorkoutRecordCardsInput) {
    await gymScopeService.resolveMemberForWrite(userId, input.gymId, input.memberId);

    const writeItems: {
      machineId: string;
      targetMuscleGroup: string;
      displayOrder: number;
    }[] = [];

    for (const item of input.items) {
      const machineId = await machineRepository.findIdByCode(item.machineCode);
      if (!machineId) {
        throw new AppError(404, 'NOT_FOUND', `Machine not found: ${item.machineCode}`);
      }

      const targetMuscleGroup = normalizeWorkoutLogTargetMuscle(
        item.machineCode,
        item.targetMuscleGroup
      );

      if (isFreeWeightMachineCode(item.machineCode) && !targetMuscleGroup) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'targetMuscleGroup is required for free-weight card order'
        );
      }

      writeItems.push({
        machineId,
        targetMuscleGroup,
        displayOrder: item.displayOrder,
      });
    }

    const updatedCount = await workoutRecordOrderRepository.upsertChangedOrders(
      userId,
      input.gymId,
      input.memberId,
      input.logDate,
      writeItems
    );

    return { updatedCount, logDate: input.logDate };
  },
};
