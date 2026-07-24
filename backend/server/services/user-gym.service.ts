import type { CreateUserGymInput, UpdateUserGymInput } from '@machinefit/shared';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { subscriptionService } from './subscription.service.js';
import { gymMemberService } from './gym-member.service.js';

export const userGymService = {
  list(userId: string) {
    return userGymRepository.listByUser(userId);
  },

  async ensureReady(userId: string, preferredName?: string) {
    const user = preferredName ? null : await userRepository.findById(userId);
    const seedName = preferredName?.trim() || user?.homeGymName?.trim() || undefined;
    const gym = await userGymRepository.ensureDefaultGym(userId, seedName);
    const [activeGymId, items] = await Promise.all([
      userGymRepository.getActiveGymId(userId),
      userGymRepository.listByUser(userId),
    ]);
    return {
      items,
      activeGymId: activeGymId ?? gym.id,
      activeGym: items.find((g) => g.id === (activeGymId ?? gym.id)) ?? gym,
    };
  },

  async create(userId: string, input: CreateUserGymInput) {
    await subscriptionService.assertCanAddGym(userId);
    const gym = await userGymRepository.create(userId, input);
    await gymMemberService.ensureSelfMember(gym.id, userId);
    return gym;
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
    await gymMemberService.ensureSelfMember(gymId, userId);
    return gym;
  },

  async assertOwned(userId: string, gymId: string) {
    const gym = await userGymRepository.findByIdForUser(userId, gymId);
    if (!gym) throw new AppError(403, 'FORBIDDEN', 'Gym does not belong to this user');
    return gym;
  },
};
