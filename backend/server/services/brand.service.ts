import { brandRepository, machineRepository } from '../repositories/machine.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { TtlCache } from '../utils/ttl-cache.js';
import type { Brand, Machine } from '@machinefit/shared';

const brandsCache = new TtlCache<Brand[]>(5 * 60_000);
const brandByCodeCache = new TtlCache<Brand>(5 * 60_000);
const brandMachinesCache = new TtlCache<Machine[]>(2 * 60_000);

export const brandService = {
  async list() {
    return brandsCache.getOrSet('all', () => brandRepository.findAll());
  },

  async getByCode(code: string) {
    const brand = await brandByCodeCache.getOrSet(code, async () => {
      const found = await brandRepository.findByCode(code);
      if (!found) throw new AppError(404, 'NOT_FOUND', `Brand not found: ${code}`);
      return found;
    });
    return brand;
  },

  async getMachines(brandCode: string) {
    return brandMachinesCache.getOrSet(brandCode, () =>
      machineRepository.findByBrandCode(brandCode)
    );
  },
};
