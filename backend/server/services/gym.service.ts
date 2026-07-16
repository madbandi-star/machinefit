import type { GymListQuery } from '@machinefit/shared';
import { gymRepository } from '../repositories/gym.repository.js';
import { buildPaginationMeta } from '../utils/pagination.util.js';
import { AppError } from '../middlewares/error.middleware.js';

export const gymService = {
  async list(query: GymListQuery) {
    const { items, total } = await gymRepository.findMany(query);
    return {
      items,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getByIdOrSlug(idOrSlug: string) {
    const gym = await gymRepository.findByIdOrSlug(idOrSlug);
    if (!gym) {
      throw new AppError(404, 'NOT_FOUND', `Gym not found: ${idOrSlug}`);
    }
    return gym;
  },

  async getDetail(idOrSlug: string) {
    const gym = await this.getByIdOrSlug(idOrSlug);
    const [photos, machines] = await Promise.all([
      gymRepository.getPhotos(gym.id),
      gymRepository.getMachines(gym.id),
    ]);
    return { ...gym, photos, machines };
  },

  async getMachines(idOrSlug: string) {
    const gym = await this.getByIdOrSlug(idOrSlug);
    return gymRepository.getMachines(gym.id);
  },

  async nearby(lat: number, lng: number, radius = 10, machineCode?: string) {
    const { items } = await gymRepository.findMany({
      page: 1,
      limit: 50,
      lat,
      lng,
      radius,
      machineCode,
    });
    return items;
  },
};
