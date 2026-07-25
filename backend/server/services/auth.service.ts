import {
  Role,
  DEMO_PASSWORD,
  LEGAL_DOC_VERSION,
  type RegisterInput,
  type LoginInput,
  type User,
  type RoleCode,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { devUsers, findDevUserByEmail, findDevUserById } from '../data/dev-users.js';
import { notificationService } from './notification.service.js';
import crypto from 'crypto';

function buildAuthResponse(user: User) {
  const tokens = {
    accessToken: signAccessToken({
      userId: user.id,
      roleCode: user.roleCode,
      email: user.email,
    }),
    refreshToken: signRefreshToken({ userId: user.id }),
    expiresIn: '15m',
  };

  return {
    user: {
      id: user.id,
      roleId: user.roleId,
      email: user.email,
      displayName: user.displayName,
      roleCode: user.roleCode,
      gender: user.gender,
      unitHeight: user.unitHeight ?? ('cm' as const),
      unitWeight: user.unitWeight ?? ('kg' as const),
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      age: user.age,
      workoutGoal: user.workoutGoal,
      homeGymId: user.homeGymId,
      homeGymName: user.homeGymName,
      activeGymId: user.activeGymId,
      experienceLevel: user.experienceLevel,
      subscriptionPlan: user.subscriptionPlan ?? 'free',
      marketingOptIn: user.marketingOptIn ?? false,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt ?? new Date().toISOString(),
      updatedAt: user.updatedAt ?? new Date().toISOString(),
    },
    tokens,
  };
}

async function resolveRegisterPasswordHash(plainPassword: string): Promise<string> {
  if (env.DEMO_AUTH) {
    return hashPassword(DEMO_PASSWORD);
  }
  return hashPassword(plainPassword);
}

export const authService = {
  async register(input: RegisterInput) {
    if (!input.agreeTerms || !input.agreePrivacy) {
      throw new AppError(400, 'CONSENT_REQUIRED', 'Terms and privacy policy must be accepted');
    }

    const pool = getPool();
    const passwordHash = await resolveRegisterPasswordHash(input.password);
    const marketingOptIn = Boolean(input.agreeMarketing);
    const legalVersion = input.legalVersion || LEGAL_DOC_VERSION;

    if (!pool) {
      if (devUsers.has(input.email)) {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
      }
      const id = crypto.randomUUID();
      devUsers.set(input.email, {
        id,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        roleCode: Role.MEMBER,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      void notificationService.notify(
        id,
        'system',
        { en: 'Welcome to MachineFit!', ko: 'MachineFit에 오신 것을 환영합니다!' },
        {
          en: 'Get personalized machine settings for your body.',
          ko: '체형에 맞는 기구 설정을 받아보세요.',
        }
      );
      return buildAuthResponse({
        id,
        roleId: 'dev-role',
        email: input.email,
        displayName: input.displayName,
        roleCode: Role.MEMBER,
        gender: input.gender,
        unitHeight: input.unitHeight ?? 'cm',
        unitWeight: input.unitWeight ?? 'kg',
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        age: input.age,
        workoutGoal: input.workoutGoal,
        homeGymId: input.homeGymId,
        homeGymName: input.homeGymName,
        experienceLevel: input.experienceLevel,
        marketingOptIn,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (await userRepository.emailExists(input.email)) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
    }

    let user;
    try {
      user = await userRepository.create({
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        gender: input.gender,
        languageCode: input.languageCode,
        unitHeight: input.unitHeight,
        unitWeight: input.unitWeight,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        age: input.age,
        workoutGoal: input.workoutGoal,
        homeGymId: input.homeGymId ?? null,
        homeGymName: input.homeGymName ?? null,
        experienceLevel: input.experienceLevel,
        marketingOptIn,
      });
      await userRepository.recordConsents(user.id, [
        { type: 'terms', version: legalVersion, agreed: true },
        { type: 'privacy', version: legalVersion, agreed: true },
        { type: 'marketing', version: legalVersion, agreed: marketingOptIn },
      ]);
    } catch (error) {
      const pgCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (pgCode === '23505') {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
      }
      throw error;
    }

    const { userGymRepository } = await import('../repositories/user-gym.repository.js');
    const defaultGym = await userGymRepository.ensureDefaultGym(
      user.id,
      user.homeGymName ?? undefined
    );
    user = { ...user, activeGymId: defaultGym.id, marketingOptIn };

    return buildAuthResponse(user);
  },

  async login(input: LoginInput) {
    const pool = getPool();

    if (!pool) {
      const user = findDevUserByEmail(input.email);
      if (!user || !user.isActive || !(await comparePassword(input.password, user.passwordHash))) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      return buildAuthResponse({
        id: user.id,
        roleId: 'dev-role',
        email: user.email,
        displayName: user.displayName,
        roleCode: user.roleCode,
        unitHeight: 'cm',
        unitWeight: 'kg',
        marketingOptIn: false,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      });
    }

    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    }

    await userRepository.updateLastLogin(user.id);

    const { passwordHash: _, ...safeUser } = user;
    return buildAuthResponse(safeUser);
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const pool = getPool();

    let roleCode: RoleCode = Role.MEMBER;
    let email = '';

    if (pool) {
      const user = await userRepository.findById(payload.userId);
      if (!user) throw new AppError(401, 'INVALID_TOKEN', 'User not found');
      if (!user.isActive) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
      roleCode = user.roleCode;
      email = user.email;
    } else {
      const user = findDevUserById(payload.userId);
      if (user) {
        roleCode = user.roleCode;
        email = user.email;
      }
    }

    const tokens = {
      accessToken: signAccessToken({
        userId: payload.userId,
        roleCode,
        email,
      }),
      refreshToken: signRefreshToken({ userId: payload.userId }),
      expiresIn: '15m',
    };
    return { tokens };
  },

  async logout(userId: string) {
    await userRepository.deleteRefreshTokens(userId);
  },

  async deactivateAccount(userId: string) {
    const pool = getPool();
    if (!pool) {
      for (const [email, user] of devUsers.entries()) {
        if (user.id === userId) {
          user.isActive = false;
          devUsers.set(email, user);
          return { message: 'Account deactivated' };
        }
      }
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    const ok = await userRepository.deactivateAccount(userId);
    if (!ok) throw new AppError(404, 'NOT_FOUND', 'User not found or already deactivated');
    return { message: 'Account deactivated' };
  },

  async setMarketingOptIn(userId: string, marketingOptIn: boolean) {
    const pool = getPool();
    if (!pool) {
      return { marketingOptIn };
    }
    const user = await userRepository.setMarketingOptIn(userId, marketingOptIn);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    await userRepository.recordConsents(userId, [
      {
        type: 'marketing',
        version: LEGAL_DOC_VERSION,
        agreed: marketingOptIn,
      },
    ]);
    return { marketingOptIn: user.marketingOptIn ?? false };
  },
};
