import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@machinefit/shared';
import { API_BASE_URL } from '@/config/apiBase';
import { useAuthStore } from '@/store/auth.store';
import { clearGymScope } from '@/utils/syncGymScope';
import { useSettingsStore } from '@/store/settings.store';
import { clearKakaoOAuthStaging } from '@/utils/oauthClient';
import { clearOAuthPending, clearTermsChecks } from '@/utils/oauthPending';

export { API_BASE_URL };
/** Default for normal JSON APIs. Uploads/heavy routes override per-request. */
export const API_TIMEOUT_MS = 12_000;
export const API_TIMEOUT_FAST_MS = 8_000;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _getRetry?: number };

const MAX_GET_RETRIES = 2;

function jitterDelayMs(attempt: number): number {
  const base = 350 * (attempt + 1);
  return base + Math.floor(Math.random() * 200);
}

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
        await new Promise((r) => setTimeout(r, jitterDelayMs(attempt)));
        return apiClient(originalRequest);
      }
    }

    const url = String(originalRequest?.url ?? '');
    if (!url.includes('/ops/ingest')) {
      const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(String(error.message));
      const isNetwork = !error.response;
      if (status === 429) {
        const header =
          error.response?.headers?.['retry-after'] ?? error.response?.headers?.['Retry-After'];
        const bodyRetry = (
          error.response?.data as { error?: { retryAfter?: number } } | undefined
        )?.error?.retryAfter;
        let retryAfterMs = 3_000;
        if (typeof header === 'string' && /^\d+$/.test(header.trim())) {
          retryAfterMs = Math.min(60_000, Math.max(1_000, Number.parseInt(header, 10) * 1000));
        } else if (typeof bodyRetry === 'number' && Number.isFinite(bodyRetry)) {
          retryAfterMs = Math.min(60_000, Math.max(1_000, bodyRetry * 1000));
        }
        (error as { retryAfterMs?: number }).retryAfterMs = retryAfterMs;
      }
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
              requestId:
                originalRequest?.headers?.['X-Request-ID'] ??
                originalRequest?.headers?.['x-request-id'],
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
