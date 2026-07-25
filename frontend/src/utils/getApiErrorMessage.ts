import axios from 'axios';
import type { TFunction } from 'i18next';

type FlattenDetails = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

type IssueDetails = Array<{ path?: (string | number)[]; message?: string }>;

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: FlattenDetails | IssueDetails;
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

function collectValidationMessages(details: FlattenDetails | IssueDetails | undefined): string[] {
  if (!details) return [];

  if (Array.isArray(details)) {
    return details
      .map((issue) => issue.message)
      .filter((message): message is string => Boolean(message));
  }

  const fieldErrors = details.fieldErrors;
  const formErrors = details.formErrors ?? [];
  return [
    ...formErrors,
    ...(fieldErrors
      ? Object.entries(fieldErrors).flatMap(([, fieldMessages]) => fieldMessages)
      : []),
  ].filter(Boolean);
}

export function getApiValidationFieldSummary(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const details = (error.response?.data as ApiErrorPayload | undefined)?.error?.details;
  const messages = collectValidationMessages(details);
  if (messages.length === 0) {
    return null;
  }

  return messages.join(', ');
}

/** Friendly validation toast for gym/member manage saves. */
export function resolveGymManageErrorMessage(error: unknown, t: TFunction): string {
  if (!axios.isAxiosError(error)) {
    return t('common:errors.submitFailed');
  }

  if (!error.response) {
    return t('common:errors.submitFailed');
  }

  const payload = error.response.data as ApiErrorPayload | undefined;
  const code = payload?.error?.code;

  if (code === 'VALIDATION_ERROR') {
    const details = payload?.error?.details;
    const labeled: string[] = [];

    if (details && !Array.isArray(details) && details.fieldErrors) {
      for (const [field, messages] of Object.entries(details.fieldErrors)) {
        if (!messages?.length) continue;
        if (field === 'heightCm') {
          labeled.push(t('gyms:manage.heightRange'));
        } else if (field === 'weightKg') {
          labeled.push(t('gyms:manage.weightRange'));
        } else if (field === 'websiteUrl') {
          labeled.push(t('gyms:manage.invalidWebsite'));
        } else if (field === 'email') {
          labeled.push(t('gyms:manage.invalidEmail'));
        } else if (field === 'birthDate') {
          labeled.push(t('gyms:manage.invalidBirthDate'));
        } else if (field === 'countryCode' || field === 'stateId' || field === 'cityId') {
          labeled.push(t('gyms:manage.locationRequired'));
        } else {
          labeled.push(messages[0]!);
        }
      }
    }

    if (labeled.length > 0) {
      return [...new Set(labeled)].join(' · ');
    }

    return getApiValidationFieldSummary(error) ?? t('common:errors.validationError');
  }

  return payload?.error?.message ?? t('common:errors.submitFailed');
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
