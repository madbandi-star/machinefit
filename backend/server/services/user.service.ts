import {
  ageFromBirthDate,
  normalizeUsername,
  usernameUniqueKey,
  validateUsername,
  type UpdateProfileInput,
} from '@machinefit/shared';
import { userRepository } from '../repositories/user.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { fortuneService } from './fortune/fortune.service.js';

function usernameError(code: string, message: string): AppError {
  return new AppError(400, code, message);
}

/** Shared gate for self-serve and admin username (display_name) changes. */
export async function applyUsernameChange(
  userId: string,
  rawUsername: string
): Promise<string> {
  const current = await userRepository.findById(userId);
  if (!current) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  // Legacy usernames may predate stricter rules — unchanged values are kept.
  if (
    usernameUniqueKey(normalizeUsername(current.displayName)) ===
    usernameUniqueKey(normalizeUsername(rawUsername))
  ) {
    return current.displayName;
  }
  const validated = validateUsername(rawUsername);
  if (!validated.ok) {
    throw usernameError(`USERNAME_${validated.code}`, validated.message);
  }
  const taken = await userRepository.isDisplayNameTaken(validated.normalized, userId);
  if (taken) {
    throw new AppError(409, 'USERNAME_TAKEN', 'Username is already in use');
  }
  return validated.normalized;
}

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

    return {
      ...user,
      needsConsent: userRepository.needsRequiredConsent(user),
    };
  },

  async updateMe(userId: string, input: UpdateProfileInput) {
    const payload: UpdateProfileInput = { ...input };
    if (payload.displayName !== undefined) {
      payload.displayName = await applyUsernameChange(userId, payload.displayName);
    }
    if (payload.age !== undefined && !payload.birthDate) {
      throw new AppError(400, 'VALIDATION_ERROR', 'age cannot be set without birthDate');
    }
    if (payload.birthDate) {
      const derived = ageFromBirthDate(payload.birthDate);
      if (derived == null) {
        throw new AppError(400, 'AGE_RESTRICTED', 'Must be at least 14 years old');
      }
      payload.age = derived;
    }
    if (payload.birthTimeUnknown === true) {
      payload.birthTime = null;
    }
    try {
      const user = await userRepository.updateProfile(userId, payload);
      if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }
      if (
        payload.birthDate !== undefined ||
        payload.birthTime !== undefined ||
        payload.birthTimeUnknown !== undefined
      ) {
        fortuneService.invalidateUser(userId);
      }
      return user;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === '23505' && payload.displayName !== undefined) {
        throw new AppError(409, 'USERNAME_TAKEN', 'Username is already in use');
      }
      throw error;
    }
  },
};
