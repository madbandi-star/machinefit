import { apiClient } from '@/services/http/axios-client';
import type {
  ApiResponse,
  PaginatedResponse,
  Machine,
  Brand,
  Gym,
  GymMachine,
  GymPhoto,
  RecommendationInput,
  RecommendationResult,
  User,
} from '@machinefit/shared';

export const machineApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<PaginatedResponse<Machine>>>('/machines', { params }),
  getByCode: (code: string) =>
    apiClient.get<ApiResponse<Machine>>(`/machines/${code}`),
  search: (q: string) =>
    apiClient.get<ApiResponse<Machine[]>>('/machines/search', { params: { q } }),
};

export const brandApi = {
  list: () => apiClient.get<ApiResponse<Brand[]>>('/brands'),
  getByCode: (code: string) =>
    apiClient.get<ApiResponse<Brand>>(`/brands/${code}`),
};

export const recommendationApi = {
  create: (input: RecommendationInput) =>
    apiClient.post<ApiResponse<RecommendationResult>>('/recommendations', input),
  getById: (id: string) =>
    apiClient.get<ApiResponse<RecommendationResult>>(`/recommendations/${id}`),
};

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    heightCm?: number;
    weightKg?: number;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  }) => apiClient.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const userApi = {
  getMe: () => apiClient.get<ApiResponse<User>>('/users/me'),
  updateMe: (data: {
    displayName?: string;
    heightCm?: number;
    weightKg?: number;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  }) => apiClient.patch<ApiResponse<User>>('/users/me', data),
};

export interface FavoriteItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  recommendationId?: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  recommendationId: string;
  settings: RecommendationResult['settings'];
  viewedAt: string;
}

export const favoriteApi = {
  list: () => apiClient.get<ApiResponse<FavoriteItem[]>>('/favorites'),
  add: (machineCode: string, recommendationId?: string) =>
    apiClient.post<ApiResponse<FavoriteItem>>('/favorites', { machineCode, recommendationId }),
  remove: (id: string) => apiClient.delete(`/favorites/${id}`),
  check: (machineCode: string) =>
    apiClient.get<ApiResponse<{ favorited: boolean }>>(`/favorites/check/${machineCode}`),
};

export const historyApi = {
  list: () => apiClient.get<ApiResponse<HistoryItem[]>>('/history'),
  clear: () => apiClient.delete('/history'),
};

export interface GymDetail extends Gym {
  photos: GymPhoto[];
  machines: GymMachine[];
}

export const gymApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<PaginatedResponse<Gym>>>('/gyms', { params }),
  getById: (idOrSlug: string) =>
    apiClient.get<ApiResponse<GymDetail>>(`/gyms/${idOrSlug}`),
  nearby: (lat: number, lng: number, params?: { radius?: number; machineCode?: string }) =>
    apiClient.get<ApiResponse<Gym[]>>('/gyms/nearby', {
      params: { lat, lng, ...params },
    }),
};

export { communityApi, machineRequestApi, ownerApi } from './community.api';
export type { OwnerDashboardStats, OwnerApplyResult } from './community.api';
export { adminApi, notificationApi } from './admin.api';
export type { AdminDashboardStats, AdminUserSummary } from './admin.api';
