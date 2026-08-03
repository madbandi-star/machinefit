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

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiresAt(): Date {
  const raw = env.JWT_REFRESH_EXPIRES_IN || '7d';
  const match = /^(\d+)([dhms])$/i.exec(raw.trim());
  const amount = match ? Number(match[1]) : 7;
  const unit = (match?.[2] ?? 'd').toLowerCase();
  const ms =
    unit === 'd'
      ? amount * 86_400_000
      : unit === 'h'
        ? amount * 3_600_000
        : unit === 'm'
          ? amount * 60_000
          : amount * 1_000;
  return new Date(Date.now() + ms);
}

async function issueAuthTokens(user: Pick<User, 'id' | 'roleCode' | 'email'>) {
  const refreshToken = signRefreshToken({ userId: user.id });
  await userRepository.saveRefreshToken(
    user.id,
    hashRefreshToken(refreshToken),
    refreshTokenExpiresAt()
  );
  return {
    accessToken: signAccessToken({
      userId: user.id,
      roleCode: user.roleCode,
      email: user.email,
    }),
    refreshToken,
    expiresIn: '15m' as const,
  };
}

async function buildAuthResponse(user: User) {
  const tokens = await issueAuthTokens(user);

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
      locationOptIn: user.locationOptIn ?? false,
      pushServiceOptIn: user.pushServiceOptIn ?? true,
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
    const locationOptIn = Boolean(input.agreeLocation);
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
        locationOptIn,
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
        locationOptIn,
      });
      await userRepository.recordConsents(user.id, [
        { type: 'terms', version: legalVersion, agreed: true },
        { type: 'privacy', version: legalVersion, agreed: true },
        { type: 'marketing', version: legalVersion, agreed: marketingOptIn },
        { type: 'location', version: legalVersion, agreed: locationOptIn },
        { type: 'push_service', version: legalVersion, agreed: true },
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

  async login(
    input: LoginInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null }
  ) {
    const pool = getPool();
    const { complianceRepository } = await import('../repositories/compliance.repository.js');

    if (!pool) {
      const user = findDevUserByEmail(input.email);
      if (!user || !user.isActive || !(await comparePassword(input.password, user.passwordHash))) {
        await complianceRepository.recordLoginEvent({
          email: input.email,
          success: false,
          failureReason: 'INVALID_CREDENTIALS',
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        });
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      await complianceRepository.recordLoginEvent({
        userId: user.id,
        email: user.email,
        success: true,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
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
    if (
      !user ||
      !user.passwordHash ||
      !(await comparePassword(input.password, user.passwordHash))
    ) {
      await complianceRepository.recordLoginEvent({
        userId: user?.id,
        email: input.email,
        success: false,
        failureReason: 'INVALID_CREDENTIALS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      await complianceRepository.recordLoginEvent({
        userId: user.id,
        email: user.email,
        success: false,
        failureReason: 'ACCOUNT_DISABLED',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    }

    await userRepository.updateLastLogin(user.id);
    await complianceRepository.recordLoginEvent({
      userId: user.id,
      email: user.email,
      success: true,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;
    return buildAuthResponse(safeUser);
  },

  async refresh(refreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const pool = getPool();

    if (pool) {
      const valid = await userRepository.hasValidRefreshToken(payload.userId, tokenHash);
      if (!valid) {
        // Migrate legacy JWTs issued before server-side persistence.
        const storedCount = await userRepository.countRefreshTokens(payload.userId);
        if (storedCount > 0) {
          throw new AppError(401, 'INVALID_TOKEN', 'Refresh token revoked or expired');
        }
      }
    }

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

    // Rotate: drop the presented token, issue a new pair.
    await userRepository.deleteRefreshTokenByHash(payload.userId, tokenHash);
    const tokens = await issueAuthTokens({
      id: payload.userId,
      roleCode,
      email,
    });
    return { tokens };
  },

  async logout(userId: string) {
    await userRepository.deleteRefreshTokens(userId);
  },

  /** Revoke a single refresh token when access JWT is already expired. */
  async logoutByRefreshToken(refreshToken: string) {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return;
    }
    await userRepository.deleteRefreshTokenByHash(
      payload.userId,
      hashRefreshToken(refreshToken)
    );
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

  async loginWithOAuth(
    provider: import('@machinefit/shared').AuthProviderCode,
    credential: import('@machinefit/shared').OAuthCredentialInput
  ) {
    const { verifyOAuthCredential } = await import('../utils/oauth-verify.util.js');
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');

    const identity = await verifyOAuthCredential(provider, credential);
    const existingLink = await authProviderRepository.findByProviderUserId(
      provider,
      identity.providerUserId
    );

    if (existingLink) {
      const user = await userRepository.findById(existingLink.userId);
      if (!user || !user.isActive) {
        throw new AppError(401, 'UNAUTHORIZED', 'Account is inactive');
      }
      await userRepository.updateLastLogin(user.id);
      return buildAuthResponse(user);
    }

    // Never auto-merge by email — allocate a dedicated users row.
    const email = await allocateOAuthUserEmail(provider, identity.providerUserId, identity.providerEmail);
    const displayName =
      credential.displayName?.trim() ||
      identity.displayName?.trim() ||
      `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`;

    try {
      const user = await userRepository.create({
        email,
        passwordHash: null,
        displayName: displayName.slice(0, 100),
        avatarUrl: identity.avatarUrl,
        experienceLevel: 'beginner',
      });
      await authProviderRepository.create({
        userId: user.id,
        provider,
        providerUserId: identity.providerUserId,
        providerEmail: identity.providerEmail,
      });
      await userRepository.updateLastLogin(user.id);
      return buildAuthResponse(user);
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === '23505') {
        // Race on provider_user_id, or leftover oauth.* user row without provider link.
        const raced = await authProviderRepository.findByProviderUserId(
          provider,
          identity.providerUserId
        );
        if (raced) {
          const user = await userRepository.findById(raced.userId);
          if (user?.isActive) return buildAuthResponse(user);
        }

        const byEmail = await userRepository.findByEmail(email);
        if (byEmail?.isActive) {
          const linkedElsewhere = await authProviderRepository.findByProviderUserId(
            provider,
            identity.providerUserId
          );
          if (linkedElsewhere && linkedElsewhere.userId !== byEmail.id) {
            throw new AppError(
              409,
              'PROVIDER_LINKED_TO_OTHER_ACCOUNT',
              'This login is already linked to another MachineFit account'
            );
          }
          const sameProvider = await authProviderRepository.findByUserAndProvider(
            byEmail.id,
            provider
          );
          if (!sameProvider && !linkedElsewhere) {
            await authProviderRepository.create({
              userId: byEmail.id,
              provider,
              providerUserId: identity.providerUserId,
              providerEmail: identity.providerEmail,
            });
          }
          await userRepository.updateLastLogin(byEmail.id);
          return buildAuthResponse(byEmail);
        }

        throw new AppError(409, 'PROVIDER_ALREADY_LINKED', 'This login is already linked');
      }
      throw error;
    }
  },

  async listProviders(userId: string) {
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const { AUTH_PROVIDERS } = await import('@machinefit/shared');
    const linked = await authProviderRepository.findByUserId(userId);
    const byProvider = new Map(linked.map((row) => [row.provider, row]));
    const hasPassword = await userRepository.hasPassword(userId);
    return {
      hasPassword,
      items: AUTH_PROVIDERS.map((provider) => {
        const row = byProvider.get(provider);
        return {
          provider,
          linked: Boolean(row),
          providerEmail: row?.providerEmail ?? null,
          linkedAt: row?.createdAt ?? null,
        };
      }),
    };
  },

  async connectProvider(
    userId: string,
    provider: import('@machinefit/shared').AuthProviderCode,
    credential: import('@machinefit/shared').OAuthCredentialInput
  ) {
    const { verifyOAuthCredential } = await import('../utils/oauth-verify.util.js');
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');

    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const identity = await verifyOAuthCredential(provider, credential);
    const existingForProvider = await authProviderRepository.findByProviderUserId(
      provider,
      identity.providerUserId
    );
    if (existingForProvider && existingForProvider.userId !== userId) {
      throw new AppError(
        409,
        'PROVIDER_LINKED_TO_OTHER_ACCOUNT',
        'This login is already linked to another MachineFit account'
      );
    }
    if (existingForProvider?.userId === userId) {
      return this.listProviders(userId);
    }

    const alreadySameProvider = await authProviderRepository.findByUserAndProvider(userId, provider);
    if (alreadySameProvider) {
      throw new AppError(409, 'PROVIDER_ALREADY_LINKED', 'This provider is already linked');
    }

    try {
      await authProviderRepository.create({
        userId,
        provider,
        providerUserId: identity.providerUserId,
        providerEmail: identity.providerEmail,
      });
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === '23505') {
        throw new AppError(
          409,
          'PROVIDER_LINKED_TO_OTHER_ACCOUNT',
          'This login is already linked to another MachineFit account'
        );
      }
      throw error;
    }
    return this.listProviders(userId);
  },

  async disconnectProvider(
    userId: string,
    provider: import('@machinefit/shared').AuthProviderCode
  ) {
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const linked = await authProviderRepository.findByUserAndProvider(userId, provider);
    if (!linked) {
      throw new AppError(404, 'NOT_FOUND', 'Provider is not linked');
    }

    const providerCount = await authProviderRepository.countByUserId(userId);
    const hasPassword = await userRepository.hasPassword(userId);
    if (providerCount <= 1 && !hasPassword) {
      throw new AppError(
        400,
        'LAST_LOGIN_METHOD',
        'At least one login method must remain on the account'
      );
    }

    await authProviderRepository.deleteByUserAndProvider(userId, provider);
    return this.listProviders(userId);
  },
};

/** Prefer provider email when free; otherwise synthetic (never auto-merge accounts). */
async function allocateOAuthUserEmail(
  provider: string,
  providerUserId: string,
  providerEmail: string | null
): Promise<string> {
  const synthetic = `oauth.${provider}.${providerUserId.replace(/[^a-zA-Z0-9_-]/g, '_')}@users.local`;
  if (!providerEmail) return synthetic;
  const taken = await userRepository.emailExists(providerEmail);
  if (taken) return synthetic;
  return providerEmail;
}
