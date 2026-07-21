import type { Locale } from '@machinefit/shared';
import { favoriteRepository } from '../repositories/favorite.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { userGymService } from './user-gym.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export const favoriteService = {
  async list(userId: string, gymId: string, locale: Locale = 'en') {
    await userGymService.assertOwned(userId, gymId);
    return favoriteRepository.listByUser(userId, gymId, locale);
  },

  async add(
    userId: string,
    gymId: string,
    machineCode: string,
    recommendationId?: string,
    locale: Locale = 'en'
  ) {
    await userGymService.assertOwned(userId, gymId);
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    return favoriteRepository.add(userId, gymId, machineId, recommendationId, locale);
  },

  async remove(userId: string, favoriteId: string) {
    await favoriteRepository.remove(userId, favoriteId);
  },

  async check(userId: string, gymId: string, machineCode: string) {
    await userGymService.assertOwned(userId, gymId);
    const favoriteId = await favoriteRepository.findIdByUserAndMachineCode(
      userId,
      gymId,
      machineCode
    );
    return { favorited: favoriteId != null, favoriteId: favoriteId ?? undefined };
  },
};
