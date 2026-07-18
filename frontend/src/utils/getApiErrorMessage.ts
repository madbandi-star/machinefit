import axios from 'axios';

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
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

  const fieldErrors = (error.response?.data as ApiErrorPayload | undefined)?.error?.details
    ?.fieldErrors;

  if (!fieldErrors) {
    return null;
  }

  return Object.entries(fieldErrors)
    .flatMap(([, messages]) => messages)
    .filter(Boolean)
    .join(', ');
}
