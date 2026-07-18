import axios from 'axios';
import type { TFunction } from 'i18next';

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
  };
}
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'networkError';
  }

  const payload = error.response.data as ApiErrorPayload | undefined;
  const code = payload?.error?.code;

  if (code === 'EMAIL_EXISTS') {
    return 'emailExists';
  }

  if (code === 'VALIDATION_ERROR') {
    return 'validationError';
  }

  return fallback;
}

export function getApiValidationFieldSummary(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const details = (error.response?.data as ApiErrorPayload | undefined)?.error?.details;
  const fieldErrors = details?.fieldErrors;
  const formErrors = details?.formErrors ?? [];

  const messages = [
    ...formErrors,
    ...(fieldErrors
      ? Object.entries(fieldErrors).flatMap(([, fieldMessages]) => fieldMessages)
      : []),
  ].filter(Boolean);

  if (messages.length === 0) {
    return null;
  }

  return messages.join(', ');
}

export function resolveRegisterErrorMessage(error: unknown, t: TFunction): string {
  if (!axios.isAxiosError(error)) {
    return t('auth.registrationFailed');
  }

  if (!error.response) {
    return t('auth.networkError');
  }

  const payload = error.response.data as ApiErrorPayload | undefined;
  const code = payload?.error?.code;

  if (code === 'EMAIL_EXISTS') {
    return t('auth.emailExists');
  }

  if (code === 'VALIDATION_ERROR') {
    return getApiValidationFieldSummary(error) ?? t('auth.validationError');
  }

  if (code === 'INTERNAL_ERROR') {
    return t('auth.serverError');
  }

  return payload?.error?.message ?? t('auth.registrationFailed');
}