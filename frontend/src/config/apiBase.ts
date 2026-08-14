/** Shared API base URL — keep free of axios/auth imports to avoid cycles. */

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

const PRODUCTION_API_DEFAULT = 'https://machinefit.onrender.com/api/v1';

export function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api/v1';
  }

  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return normalizeApiBaseUrl(configured || PRODUCTION_API_DEFAULT);
}

export const API_BASE_URL = resolveApiBaseUrl();
