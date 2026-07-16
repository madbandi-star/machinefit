import type { UpdateProfileInput } from '@machinefit/shared';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const userService = {
  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
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
