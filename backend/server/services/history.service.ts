import { historyRepository } from '../repositories/history.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const historyService = {
  async list(
    userId: string,
    options: { limit?: number; machineCode?: string; from?: string; to?: string } = {}
  ) {
    return historyRepository.listByUser(userId, options);
  },

  async record(userId: string, machineCode: string, recommendationId: string) {
    const machineId = await machineRepository.findIdByCode(machineCode);
    if (!machineId) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${machineCode}`);
    }
    await historyRepository.record(userId, machineId, recommendationId);
  },

  async clear(userId: string) {
    await historyRepository.clear(userId);
  },

  async remove(userId: string, historyId: string) {
    await historyRepository.remove(userId, historyId);
  },
};
