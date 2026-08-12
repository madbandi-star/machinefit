import type { Locale } from '@machinefit/shared';
import { isAllGymsId } from '@machinefit/shared';
import { favoriteRepository } from '../repositories/favorite.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { awardPointsSafe } from './points.service.js';

export const favoriteService = {
  async list(
    userId: string,
    gymId: string,
    locale: Locale = 'en',
    options: { memberId?: string } = {}
  ) {
    if (isAllGymsId(gymId)) {
      const { gymIds } = await gymScopeService.resolveGymFilter(userId, gymId);
      return favoriteRepository.listByUser(userId, gymId, locale, {
        gymIds,
        memberId: options.memberId,
      });
    }
    await gymScopeService.assertOwned(userId, gymId);
    return favoriteRepository.listByUser(userId, gymId, locale, {
      memberId: options.memberId,
    });
  },

  async add(
    userId: string,
    gymId: string,
    memberId: string,
    machineCode: string,
    recommendationId?: string,
    locale: Locale = 'en'
  ) {
    await gymScopeService.resolveMemberForWrite(userId, gymId, memberId);
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    const favorite = await favoriteRepository.add(
      userId,
      gymId,
      memberId,
      machineId,
      recommendationId,
      locale
    );
    awardPointsSafe({
      userId,
      actionCode: 'favorite_add',
      referenceType: 'machine',
      referenceId: machineCode,
      idempotencyKey: `favorite_add:machine:${userId}:${machineCode}`,
    });
    return favorite;
  },

  async remove(userId: string, favoriteId: string) {
    await favoriteRepository.remove(userId, favoriteId);
  },

  async removeMany(userId: string, favoriteIds: string[]) {
    const uniqueIds = [...new Set(favoriteIds)];
    if (uniqueIds.length === 0) {
      throw new AppError(400, 'INVALID_INPUT', 'No favorite ids provided');
    }
    if (uniqueIds.length > 200) {
      throw new AppError(400, 'INVALID_INPUT', 'Too many favorite ids');
    }
    const removed = await favoriteRepository.removeMany(userId, uniqueIds);
    return { removed };
  },

  async check(userId: string, gymId: string, machineCode: string, memberId?: string) {
    await gymScopeService.assertOwned(userId, gymId);
    const favoriteId = await favoriteRepository.findIdByUserAndMachineCode(
      userId,
      gymId,
      machineCode,
      memberId
    );
    return { favorited: favoriteId != null, favoriteId: favoriteId ?? undefined };
  },
};
