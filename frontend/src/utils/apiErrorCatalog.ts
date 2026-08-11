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
  USAGE_LIMIT: 'errors.usageLimit',
  PLAN_LIMIT: 'errors.usageLimit',
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
  const code = (error.response.data as { error?: { code?: string; message?: string } } | undefined)
    ?.error?.code;
  const byCode = translateApiErrorCode(code, t);
  if (byCode) return byCode;

  // Prefer FE copy; avoid showing raw KO/EN server prose when we have a generic fallback.
  return t(fallbackKey);
}
