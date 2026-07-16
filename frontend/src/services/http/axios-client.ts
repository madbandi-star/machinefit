import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@machinefit/shared';
import { useAuthStore } from '@/store/auth.store';

function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1'
);

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
