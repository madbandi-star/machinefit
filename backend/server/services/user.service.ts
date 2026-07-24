import type { UpdateProfileInput } from '@machinefit/shared';
import { userRepository } from '../repositories/user.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const userService = {
  async getMe(userId: string) {
    let user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    // Backfill profile home gym from personal gyms when signup name was only
    // stored on user_gyms (or home_gym_name was never hydrated into auth state).
    if (!user.homeGymName?.trim()) {
      const gyms = await userGymRepository.listByUser(userId);
      const preferred = gyms.find((g) => g.isDefault) ?? gyms[0];
      const name = preferred?.name?.trim();
      if (name && name !== '기본 헬스장') {
        const updated = await userRepository.updateProfile(userId, { homeGymName: name });
        if (updated) user = updated;
        else user = { ...user, homeGymName: name };
      }
    }

    return user;
  },

  async updateMe(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.updateProfile(userId, input);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return user;
  },
};
