import { favoriteRepository } from '../repositories/favorite.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const favoriteService = {
  async list(userId: string) {
    return favoriteRepository.listByUser(userId);
  },

  async add(userId: string, machineCode: string, recommendationId?: string) {
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    return favoriteRepository.add(userId, machineId, recommendationId);
  },

  async remove(userId: string, favoriteId: string) {
    await favoriteRepository.remove(userId, favoriteId);
  },

  async check(userId: string, machineCode: string) {
    const favorited = await favoriteRepository.isFavorited(userId, machineCode);
    return { favorited };
  },
};
