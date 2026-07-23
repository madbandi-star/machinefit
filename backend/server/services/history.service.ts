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
      memberId: string;
      limit?: number;
      machineCode?: string;
      from?: string;
      to?: string;
    },
    locale: Locale = 'en'
  ) {
    const linkScope = await gymScopeService.resolveLinkedRecordListScope(
      userId,
      options.memberId
    );

    if (isAllGymsId(options.gymId)) {
      await gymScopeService.assertMemberOwned(userId, options.memberId);
      const { gymIds } = await gymScopeService.resolveGymFilter(userId, options.gymId);
      return historyRepository.listByUser(userId, { ...options, gymIds, linkScope }, locale);
    }
    await gymScopeService.resolveMemberForWrite(userId, options.gymId, options.memberId);
    return historyRepository.listByUser(userId, { ...options, linkScope }, locale);
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

  async clear(userId: string, gymId: string, memberId: string) {
    await gymScopeService.resolveMemberForWrite(userId, gymId, memberId);
    await historyRepository.clear(userId, gymId, memberId);
  },

  async remove(userId: string, historyId: string) {
    await historyRepository.remove(userId, historyId);
  },
};
