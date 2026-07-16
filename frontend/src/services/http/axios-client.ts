import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@machinefit/shared';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

const PRODUCTION_API_DEFAULT = 'https://machinefit-api.onrender.com/api/v1';

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
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshAccessToken(): Promise<AuthTokens | null> {
  const { tokens, user, updateTokens, clearAuth } = useAuthStore.getState();
  if (!tokens?.refreshToken || !user) {
    clearAuth();
    return null;
  }

  try {
    const res = await axios.post<{ success: boolean; data: { tokens: AuthTokens } }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: tokens.refreshToken }
    );
    const newTokens = res.data.data.tokens;
    updateTokens(newTokens);
    return newTokens;
  } catch {
    clearAuth();
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const tokens = useAuthStore.getState().tokens;
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  config.headers['Accept-Language'] = useSettingsStore.getState().locale;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
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

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newTokens = await refreshPromise;
      if (newTokens?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);
