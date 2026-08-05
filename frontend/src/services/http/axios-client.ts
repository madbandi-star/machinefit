import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@machinefit/shared';
import { useAuthStore } from '@/store/auth.store';
import { clearGymScope } from '@/utils/syncGymScope';
import { useSettingsStore } from '@/store/settings.store';
import { clearKakaoOAuthStaging } from '@/utils/oauthClient';
import { clearOAuthPending, clearTermsChecks } from '@/utils/oauthPending';

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

const PRODUCTION_API_DEFAULT = 'https://machinefit.onrender.com/api/v1';

function resolveApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api/v1';
  }

  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  return normalizeApiBaseUrl(configured || PRODUCTION_API_DEFAULT);
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _getRetry?: number };

const MAX_GET_RETRIES = 2;

function isRetryableGet(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return true;
  if (!error.config || error.config.method?.toLowerCase() !== 'get') return false;
  const status = error.response?.status;
  if (status && [502, 503, 504].includes(status)) return true;
  return !error.response;
}

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const { tokens, user, isAuthenticated, updateTokens } = useAuthStore.getState();
  if (!user || !isAuthenticated) {
    return null;
  }

  try {
    // Body refresh is the cross-site fallback; HttpOnly cookie still sent when present.
    const body = tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {};
    const res = await axios.post<{ success: boolean; data: { tokens: AuthTokens } }>(
      `${API_BASE_URL}/auth/refresh`,
      body,
      { withCredentials: true }
    );
    const newTokens = res.data.data.tokens;
    updateTokens(newTokens);
    return newTokens;
  } catch {
    return null;
  }
}

function runSharedRefresh(): Promise<AuthTokens | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const tokens = useAuthStore.getState().tokens;
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  config.headers['Accept-Language'] = useSettingsStore.getState().locale;
  // Correlate FE → BE logs (server may overwrite with its own id).
  if (!config.headers['X-Request-ID'] && !config.headers['x-request-id']) {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `mf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    config.headers['X-Request-ID'] = id;
  }
  // FormData needs the browser-generated multipart boundary — never force JSON/multipart.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers as {
      set?: (key: string, value: unknown) => void;
      delete?: (key: string) => void;
    } & Record<string, unknown>;
    if (typeof headers.delete === 'function') {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else if (typeof headers.set === 'function') {
      // Axios: `false` means "omit this header so the XHR sets multipart boundary".
      headers.set('Content-Type', false);
    } else {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    void import('@/store/apiHealth.store').then(({ useApiHealthStore }) => {
      useApiHealthStore.getState().recordSuccess();
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.endsWith('/auth/refresh')
    ) {
      originalRequest._retry = true;

      const newTokens = await runSharedRefresh();
      if (newTokens?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      }

      useAuthStore.getState().clearAuth();
      clearGymScope();
      clearKakaoOAuthStaging();
      clearOAuthPending();
      clearTermsChecks();
    }

    if (originalRequest && isRetryableGet(error)) {
      const attempt = originalRequest._getRetry ?? 0;
      if (attempt < MAX_GET_RETRIES) {
        originalRequest._getRetry = attempt + 1;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        return apiClient(originalRequest);
      }
    }

    const url = String(originalRequest?.url ?? '');
    if (!url.includes('/ops/ingest')) {
      const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(String(error.message));
      const isNetwork = !error.response;
      if (isTimeout || isNetwork || (typeof status === 'number' && status >= 500)) {
        void import('@/utils/opsTelemetry').then(({ trackOpsError }) => {
          trackOpsError({
            title: isTimeout ? 'NetworkTimeout' : isNetwork ? 'NetworkError' : `API_${status}`,
            message: error.message,
            severity: status === 500 || isTimeout ? 'critical' : 'high',
            source: 'api',
            meta: {
              url: url.slice(0, 300),
              method: originalRequest?.method,
              status,
            },
          });
        });
        void import('@/store/apiHealth.store').then(({ useApiHealthStore }) => {
          const kind =
            isNetwork || isTimeout ? 'network' : status === 503 ? 'unavailable' : 'server';
          useApiHealthStore.getState().recordFailure(kind, status ?? null);
        });
      }
    }

    return Promise.reject(error);
  }
);

/** Silent boot refresh: sessionStorage refresh and/or HttpOnly cookie → memory access token. */
export async function restoreSessionFromRefresh(): Promise<boolean> {
  const tokens = await runSharedRefresh();
  return Boolean(tokens?.accessToken);
}
