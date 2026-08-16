import { brandFavoriteRepository } from '../repositories/brand-favorite.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const brandFavoriteService = {
  async list(userId: string) {
    await brandFavoriteRepository.seedDefaultsIfNeeded(userId);
    return brandFavoriteRepository.listByUser(userId);
  },

  async listIds(userId: string) {
    await brandFavoriteRepository.seedDefaultsIfNeeded(userId);
    return brandFavoriteRepository.listBrandIds(userId);
  },

  async add(userId: string, brandId: string) {
    try {
      // If user never seeded, mark seeded so defaults don't overwrite intentional empty later.
      await brandFavoriteRepository.seedDefaultsIfNeeded(userId);
      return await brandFavoriteRepository.add(userId, brandId);
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'NOT_FOUND') {
        throw new AppError(404, 'NOT_FOUND', 'Brand not found');
      }
      throw err;
    }
  },

  async remove(userId: string, brandId: string) {
    await brandFavoriteRepository.seedDefaultsIfNeeded(userId);
    const removed = await brandFavoriteRepository.removeByBrandId(userId, brandId);
    if (!removed) {
      throw new AppError(404, 'NOT_FOUND', 'Brand favorite not found');
    }
    return { message: 'Removed' };
  },
};
