import type { CreateUserGymInput, UpdateUserGymInput } from '@machinefit/shared';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const userGymService = {
  list(userId: string) {
    return userGymRepository.listByUser(userId);
  },

  async ensureReady(userId: string, preferredName?: string) {
    const gym = await userGymRepository.ensureDefaultGym(userId, preferredName);
    const activeGymId = await userGymRepository.getActiveGymId(userId);
    const items = await userGymRepository.listByUser(userId);
    return {
      items,
      activeGymId: activeGymId ?? gym.id,
      activeGym: items.find((g) => g.id === (activeGymId ?? gym.id)) ?? gym,
    };
  },

  async create(userId: string, input: CreateUserGymInput) {
    return userGymRepository.create(userId, input);
  },

  async update(userId: string, gymId: string, input: UpdateUserGymInput) {
    const updated = await userGymRepository.update(userId, gymId, input);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    return updated;
  },

  async remove(userId: string, gymId: string) {
    const ok = await userGymRepository.remove(userId, gymId);
    if (!ok) {
      throw new AppError(
        400,
        'CANNOT_DELETE_LAST_GYM',
        'At least one gym is required. Create another gym before deleting this one.'
      );
    }
  },

  async select(userId: string, gymId: string) {
    const gym = await userGymRepository.setActive(userId, gymId);
    if (!gym) throw new AppError(404, 'NOT_FOUND', 'Gym not found');
    return gym;
  },

  async assertOwned(userId: string, gymId: string) {
    const gym = await userGymRepository.findByIdForUser(userId, gymId);
    if (!gym) throw new AppError(403, 'FORBIDDEN', 'Gym does not belong to this user');
    return gym;
  },
};
