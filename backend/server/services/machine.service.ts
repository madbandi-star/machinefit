import type { MachineListQuery } from '@machinefit/shared';
import { machineRepository } from '../repositories/machine.repository.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { AppError } from '../middlewares/error.middleware.js';

export const machineService = {
  async list(query: MachineListQuery) {
    const offset = (query.page - 1) * query.limit;
    const { items, total } = await machineRepository.findMany({
      brandCode: query.brandCode,
      muscleGroup: query.muscleGroup,
      machineType: query.machineType,
      q: query.q,
      limit: query.limit,
      offset,
    });

    return {
      items,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getByCode(code: string) {
    const machine = await machineRepository.findByCode(code);
    if (!machine) {
      throw new AppError(404, 'NOT_FOUND', `Machine not found: ${code}`);
    }
    return machine;
  },

  async search(q: string) {
    if (!q) return [];
    const { items } = await machineRepository.findMany({
      q,
      limit: 50,
      offset: 0,
    });
    return items;
  },
};
