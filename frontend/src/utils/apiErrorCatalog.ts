/**
 * Map backend AppError.code → i18n key under common:errors.*
 * Prefer codes over raw server message strings for UI copy.
 */
import type { TFunction } from 'i18next';
import axios from 'axios';

const CODE_TO_KEY: Record<string, string> = {
  EMAIL_EXISTS: 'errors.emailExists',
  INVALID_CREDENTIALS: 'errors.invalidCredentials',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.notFound',
  VALIDATION_ERROR: 'errors.validationError',
  INTERNAL_ERROR: 'errors.serverError',
  TOKEN_EXPIRED: 'errors.tokenExpired',
  NETWORK_ERROR: 'errors.networkError',
  SUBSCRIPTION_ACTIVE: 'errors.submitFailed',
  CHECKOUT_UNAVAILABLE: 'errors.submitFailed',
  CHECKOUT_FAILED: 'errors.submitFailed',
  TRIAL_CONSUMED: 'errors.submitFailed',
  NO_SUBSCRIPTION: 'errors.notFound',
  COUPON_NOT_FOUND: 'errors.notFound',
  COUPON_USED: 'errors.validationError',
  CONTENT_POLICY_VIOLATION: 'errors.contentPolicyViolation',
  AGE_RESTRICTED: 'errors.ageRestricted',
  CONSENT_REQUIRED: 'settings.consentRequiredToast',
  USAGE_LIMIT: 'errors.usageLimit',
  DAILY_QUOTA_EXCEEDED: 'errors.dailyQuotaExceeded',
  MONTHLY_QUOTA_EXCEEDED: 'errors.dailyQuotaExceeded',
  RECOMMENDATION_LIMIT_EXCEEDED: 'errors.dailyQuotaExceeded',
  STOCK_LIMIT_EXCEEDED: 'errors.stockLimitExceeded',
  RATE_LIMIT: 'errors.rateLimit',
  RATE_LIMIT_EXCEEDED: 'errors.rateLimit',
  REQUEST_IN_PROGRESS: 'errors.rateLimit',
  BURST_REQUEST_DETECTED: 'errors.rateLimit',
  PLAN_LIMIT: 'errors.usageLimit',
  CSRF_REJECTED: 'errors.csrfRejected',
  MIN_BRAND_FAVORITES: 'brandFavorites.minRequired',
  MEMBER_PROFILE_INCOMPLETE: 'auth.memberProfileRequiredForRecommend',
};

export function translateApiErrorCode(code: string | undefined, t: TFunction): string | null {
  if (!code) return null;
  const key = CODE_TO_KEY[code];
  if (!key) return null;
  const translated = t(key);
  if (!translated || translated === key) return null;
  return translated;
}

export function resolveApiErrorMessage(
  error: unknown,
  t: TFunction,
  fallbackKey = 'errors.submitFailed'
): string {
  if (!axios.isAxiosError(error)) {
    return t(fallbackKey);
  }
  if (!error.response) {
    return t('errors.networkError');
  }
  const status = error.response.status;
  if (status === 401) {
    return t('errors.unauthorized');
  }
  if (status === 403) {
    return t('errors.forbidden');
  }

  const code = (error.response.data as { error?: { code?: string; message?: string } } | undefined)
    ?.error?.code;

  if (
    code === 'DAILY_QUOTA_EXCEEDED' ||
    code === 'MONTHLY_QUOTA_EXCEEDED' ||
    code === 'STOCK_LIMIT_EXCEEDED' ||
    code === 'USAGE_LIMIT' ||
    code === 'RECOMMENDATION_LIMIT_EXCEEDED'
  ) {
    void import('@/ads/adEventBus').then(({ adEventBus }) => {
      adEventBus.emit({ placement: 'LIMIT_REACHED', event: 'FREE_LIMIT_REACHED' });
    });
  }

  // Prefer typed quota/rate codes before the generic HTTP 429 copy.
  const byCode = translateApiErrorCode(code, t);
  if (byCode) return byCode;

  if (status === 429) {
    return t('errors.rateLimit');
  }
  if (status >= 500) {
    return t('errors.serverError');
  }

  // Prefer FE copy; avoid showing raw KO/EN server prose when we have a generic fallback.
  return t(fallbackKey);
}

/** Prefer Retry-After header / body for cooldown UX. */
export { getRetryAfterMs, createIdempotencyKey } from '@/utils/asyncActionGuard';

