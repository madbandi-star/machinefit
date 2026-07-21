import type { Machine, MachineListQuery } from '@machinefit/shared';
import { machineRepository } from '../repositories/machine.repository.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { AppError } from '../middlewares/error.middleware.js';
import { TtlCache } from '../utils/ttl-cache.js';

const machineByCodeCache = new TtlCache<Machine>(2 * 60_000);
const machineListCache = new TtlCache<{
  items: Machine[];
  meta: ReturnType<typeof buildPaginationMeta>;
}>(60_000);

function listCacheKey(query: MachineListQuery): string {
  return JSON.stringify({
    page: query.page,
    limit: query.limit,
    brandCode: query.brandCode ?? '',
    muscleGroup: query.muscleGroup ?? '',
    machineType: query.machineType ?? '',
    q: query.q ?? '',
  });
}

export const machineService = {
  async list(query: MachineListQuery) {
    // Cache unfiltered / lightly filtered catalog pages (search q changes too often).
    const canCache = !query.q?.trim();
    const key = listCacheKey(query);

    const load = async () => {
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
    };

    if (canCache) {
      return machineListCache.getOrSet(key, load);
    }
    return load();
  },

  async getByCode(code: string) {
    return machineByCodeCache.getOrSet(code, async () => {
      const machine = await machineRepository.findByCode(code);
      if (!machine) {
        throw new AppError(404, 'NOT_FOUND', `Machine not found: ${code}`);
      }
      return machine;
    });
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
