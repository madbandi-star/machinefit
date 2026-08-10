import {
  Role,
  LEGAL_DOC_VERSION,
  LEGAL_DOC_VERSIONS,
  type User,
  type RoleCode,
  type OAuthCompleteInput,
  type ConsentAcceptInput,
  type OAuthLoginResult,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signOAuthPendingToken,
  verifyOAuthPendingToken,
} from '../utils/jwt.util.js';
import { findDevUserById } from '../data/dev-users.js';
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

function withConsentFlags(user: User): User {
  const needsConsent = userRepository.needsRequiredConsent(user);
  return {
    ...user,
    needsConsent,
  };
}

async function buildAuthResponse(user: User) {
  const tokens = await issueAuthTokens(user);
  const safe = withConsentFlags(user);

  return {
    user: {
      id: safe.id,
      roleId: safe.roleId,
      email: safe.email,
      displayName: safe.displayName,
      roleCode: safe.roleCode,
      gender: safe.gender,
      unitHeight: safe.unitHeight ?? ('cm' as const),
      unitWeight: safe.unitWeight ?? ('kg' as const),
      heightCm: safe.heightCm,
      weightKg: safe.weightKg,
      age: safe.age,
      workoutGoal: safe.workoutGoal,
      homeGymId: safe.homeGymId,
      homeGymName: safe.homeGymName,
      activeGymId: safe.activeGymId,
      experienceLevel: safe.experienceLevel,
      subscriptionPlan: safe.subscriptionPlan ?? 'free',
      marketingOptIn: safe.marketingOptIn ?? false,
      locationOptIn: safe.locationOptIn ?? false,
      pushServiceOptIn: safe.pushServiceOptIn ?? true,
      termsVersion: safe.termsVersion ?? null,
      privacyVersion: safe.privacyVersion ?? null,
      locationVersion: safe.locationVersion ?? null,
      marketingVersion: safe.marketingVersion ?? null,
      termsAgreedAt: safe.termsAgreedAt ?? null,
      privacyAgreedAt: safe.privacyAgreedAt ?? null,
      locationAgreedAt: safe.locationAgreedAt ?? null,
      marketingAgreedAt: safe.marketingAgreedAt ?? null,
      needsConsent: safe.needsConsent ?? false,
      isActive: safe.isActive ?? true,
      createdAt: safe.createdAt ?? new Date().toISOString(),
      updatedAt: safe.updatedAt ?? new Date().toISOString(),
    },
    tokens,
  };
}

function currentLegalVersions() {
  return {
    terms: LEGAL_DOC_VERSIONS.terms,
    privacy: LEGAL_DOC_VERSIONS.privacy,
    location: LEGAL_DOC_VERSIONS.location,
    marketing: LEGAL_DOC_VERSIONS.marketing,
  };
}

async function applyConsentBundle(
  userId: string,
  input: {
    agreeMarketing?: boolean;
    agreeLocation?: boolean;
    termsVersion?: string;
    privacyVersion?: string;
    locationVersion?: string;
    marketingVersion?: string;
  },
  meta?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    source?: string;
  }
) {
  const termsVersion = input.termsVersion || LEGAL_DOC_VERSIONS.terms;
  const privacyVersion = input.privacyVersion || LEGAL_DOC_VERSIONS.privacy;
  const locationVersion = input.locationVersion || LEGAL_DOC_VERSIONS.location;
  const marketingVersion = input.marketingVersion || LEGAL_DOC_VERSIONS.marketing;
  const marketingOptIn = Boolean(input.agreeMarketing);
  const locationOptIn = Boolean(input.agreeLocation);

  const items = [
    { type: 'terms', version: termsVersion, agreed: true },
    { type: 'privacy', version: privacyVersion, agreed: true },
    { type: 'marketing', version: marketingVersion, agreed: marketingOptIn },
    { type: 'location', version: locationVersion, agreed: locationOptIn },
    { type: 'push_service', version: termsVersion, agreed: true },
  ];

  await userRepository.recordConsents(userId, items);

  try {
    const { complianceRepository } = await import('../repositories/compliance.repository.js');
    await complianceRepository.recordConsentMeta(userId, items, {
      regionCode: 'KR',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      source: meta?.source ?? 'app',
    });
  } catch {
    // Non-blocking — consent versions already persisted on users/user_consents.
  }
}

export const authService = {
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
      const { updateDevUser } = await import('../data/dev-users.js');
      const user = updateDevUser(userId, { isActive: false });
      if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
      return { message: 'Account deactivated' };
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
    credential: import('@machinefit/shared').OAuthCredentialInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null }
  ): Promise<OAuthLoginResult> {
    const { verifyOAuthCredential } = await import('../utils/oauth-verify.util.js');
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const { complianceRepository } = await import('../repositories/compliance.repository.js');

    const identity = await verifyOAuthCredential(provider, credential);
    const existingLink = await authProviderRepository.findByProviderUserId(
      provider,
      identity.providerUserId
    );

    if (existingLink) {
      const user = await userRepository.findById(existingLink.userId);
      if (!user || !user.isActive) {
        await complianceRepository
          .recordLoginEvent({
            userId: existingLink.userId,
            email: user?.email ?? identity.providerEmail,
            success: false,
            failureReason: 'ACCOUNT_INACTIVE',
            ipAddress: meta?.ipAddress,
            userAgent: meta?.userAgent,
          })
          .catch(() => undefined);
        throw new AppError(401, 'UNAUTHORIZED', 'Account is inactive');
      }
      await userRepository.updateLastLogin(user.id);
      await complianceRepository
        .recordLoginEvent({
          userId: user.id,
          email: user.email,
          success: true,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        })
        .catch(() => undefined);
      const auth = await buildAuthResponse(user);
      if (auth.user.needsConsent) {
        return {
          status: 'needs_consent',
          reason: 'version_update',
          user: auth.user,
          tokens: auth.tokens,
          versions: currentLegalVersions(),
        };
      }
      return { status: 'authenticated', user: auth.user, tokens: auth.tokens };
    }

    const displayName =
      credential.displayName?.trim() ||
      identity.displayName?.trim() ||
      `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`;

    const pendingToken = signOAuthPendingToken({
      provider,
      providerUserId: identity.providerUserId,
      providerEmail: identity.providerEmail,
      displayName: displayName.slice(0, 100),
      avatarUrl: identity.avatarUrl,
    });

    return {
      status: 'needs_consent',
      reason: 'signup',
      pendingToken,
      identity: {
        provider,
        email: identity.providerEmail,
        displayName: displayName.slice(0, 100),
      },
      versions: currentLegalVersions(),
    };
  },

  async completeOAuthSignup(
    input: OAuthCompleteInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null }
  ) {
    if (!input.agreeTerms || !input.agreePrivacy) {
      throw new AppError(400, 'CONSENT_REQUIRED', 'Terms and privacy policy must be accepted');
    }

    let pending;
    try {
      pending = verifyOAuthPendingToken(input.pendingToken);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Signup session expired. Please sign in again.');
    }

    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const existingLink = await authProviderRepository.findByProviderUserId(
      pending.provider,
      pending.providerUserId
    );
    if (existingLink) {
      const user = await userRepository.findById(existingLink.userId);
      if (!user || !user.isActive) {
        throw new AppError(401, 'UNAUTHORIZED', 'Account is inactive');
      }
      await applyConsentBundle(user.id, input, meta);
      const refreshed = await userRepository.findById(user.id);
      if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'User not found');
      await userRepository.updateLastLogin(refreshed.id);
      return buildAuthResponse(refreshed);
    }

    const email = await allocateOAuthUserEmail(
      pending.provider,
      pending.providerUserId,
      pending.providerEmail
    );
    const displayName =
      pending.displayName?.trim() ||
      `${pending.provider.charAt(0).toUpperCase()}${pending.provider.slice(1)} User`;

    try {
      let user = await userRepository.create({
        email,
        displayName: displayName.slice(0, 100),
        avatarUrl: pending.avatarUrl ?? undefined,
        experienceLevel: 'beginner',
        marketingOptIn: Boolean(input.agreeMarketing),
        locationOptIn: Boolean(input.agreeLocation),
      });
      await authProviderRepository.create({
        userId: user.id,
        provider: pending.provider,
        providerUserId: pending.providerUserId,
        providerEmail: pending.providerEmail,
      });
      await applyConsentBundle(user.id, input, { ...meta, source: 'oauth_signup' });

      const { userGymRepository } = await import('../repositories/user-gym.repository.js');
      const defaultGym = await userGymRepository.ensureDefaultGym(user.id);
      user = { ...user, activeGymId: defaultGym.id };

      // 7-day Premium trial on first social signup (feature flag signup_trial_auto).
      try {
        const { billingService } = await import('./billing.service.js');
        await billingService.maybeStartSignupTrial(user.id);
      } catch {
        // Non-blocking — signup must succeed even if billing tables missing.
      }

      await userRepository.updateLastLogin(user.id);
      const refreshed = await userRepository.findById(user.id);
      if (!refreshed) throw new AppError(500, 'INTERNAL', 'Failed to load created user');

      void notificationService.notify(
        refreshed.id,
        'system',
        { en: 'Welcome to MachineFit!', ko: 'MachineFit에 오신 것을 환영합니다!' },
        {
          en: 'Get personalized machine settings for your body.',
          ko: '체형에 맞는 기구 설정을 받아보세요.',
        }
      );

      return buildAuthResponse(refreshed);
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (code === '23505') {
        const raced = await authProviderRepository.findByProviderUserId(
          pending.provider,
          pending.providerUserId
        );
        if (raced) {
          const user = await userRepository.findById(raced.userId);
          if (user?.isActive) {
            await applyConsentBundle(user.id, input, meta);
            const refreshed = await userRepository.findById(user.id);
            if (refreshed) return buildAuthResponse(refreshed);
          }
        }
        throw new AppError(409, 'PROVIDER_ALREADY_LINKED', 'This login is already linked');
      }
      throw error;
    }
  },

  async acceptConsents(
    userId: string,
    input: ConsentAcceptInput,
    meta?: { ipAddress?: string | null; userAgent?: string | null }
  ) {
    if (!input.agreeTerms || !input.agreePrivacy) {
      throw new AppError(400, 'CONSENT_REQUIRED', 'Terms and privacy policy must be accepted');
    }
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    await applyConsentBundle(userId, input, { ...meta, source: 'consent_update' });
    const refreshed = await userRepository.findById(userId);
    if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return buildAuthResponse(refreshed);
  },

  async listProviders(userId: string) {
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const { AUTH_PROVIDERS } = await import('@machinefit/shared');
    const linked = await authProviderRepository.findByUserId(userId);
    const byProvider = new Map(linked.map((row) => [row.provider, row]));
    return {
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

    // One social login per account: connecting another provider replaces the current one.
    const existingLinks = await authProviderRepository.findByUserId(userId);
    for (const link of existingLinks) {
      if (link.provider === provider) continue;
      await authProviderRepository.deleteByUserAndProvider(userId, link.provider);
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
    if (providerCount <= 1) {
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
