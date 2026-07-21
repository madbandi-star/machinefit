import type { Locale } from '@machinefit/shared';
import { historyRepository } from '../repositories/history.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { userGymService } from './user-gym.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export const historyService = {
  async list(
    userId: string,
    options: {
      gymId: string;
      limit?: number;
      machineCode?: string;
      from?: string;
      to?: string;
    },
    locale: Locale = 'en'
  ) {
    await userGymService.assertOwned(userId, options.gymId);
    return historyRepository.listByUser(userId, options, locale);
  },

  async record(userId: string, gymId: string, machineCode: string, recommendationId: string) {
    await userGymService.assertOwned(userId, gymId);
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    await historyRepository.record(userId, gymId, machineId, recommendationId);
  },

  async clear(userId: string, gymId: string) {
    await userGymService.assertOwned(userId, gymId);
    await historyRepository.clear(userId, gymId);
  },

  async remove(userId: string, historyId: string) {
    await historyRepository.remove(userId, historyId);
  },
};
