import type { Locale } from '@machinefit/shared';
import { isAllGymsId } from '@machinefit/shared';
import { historyRepository } from '../repositories/history.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export const historyService = {
  async list(
    userId: string,
    options: {
      gymId: string;
      memberId?: string;
      limit?: number;
      machineCode?: string;
      from?: string;
      to?: string;
    },
    locale: Locale = 'en'
  ) {
    if (isAllGymsId(options.gymId)) {
      const { gymIds } = await gymScopeService.resolveGymFilter(userId, options.gymId);
      return historyRepository.listByUser(userId, { ...options, gymIds }, locale);
    }
    await gymScopeService.assertOwned(userId, options.gymId);
    return historyRepository.listByUser(userId, options, locale);
  },

  async record(
    userId: string,
    gymId: string,
    memberId: string,
    machineCode: string,
    recommendationId: string
  ) {
    await gymScopeService.resolveMemberForWrite(userId, gymId, memberId);
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    await historyRepository.record(userId, gymId, memberId, machineId, recommendationId);
  },

  async clear(userId: string, gymId: string) {
    await gymScopeService.assertOwned(userId, gymId);
    await historyRepository.clear(userId, gymId);
  },

  async remove(userId: string, historyId: string) {
    await historyRepository.remove(userId, historyId);
  },
};
