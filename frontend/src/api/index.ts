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
  RecommendationSettings,
  User,
  Gender,
  WorkoutGoal,
  WorkoutLog,
  UpsertWorkoutLogInput,
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
  getMachines: (code: string) =>
    apiClient.get<ApiResponse<Machine[]>>(`/brands/${code}/machines`),
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
    gender: Gender;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    heightCm: number;
    weightKg: number;
    age: number;
    workoutGoal: WorkoutGoal;
    homeGymId?: string;
    homeGymName?: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  }) => apiClient.post('/auth/register', data),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const userApi = {
  getMe: () => apiClient.get<ApiResponse<User>>('/users/me'),
  updateMe: (data: {
    displayName?: string;
    gender?: Gender;
    heightCm?: number;
    weightKg?: number;
    age?: number;
    workoutGoal?: WorkoutGoal;
    homeGymId?: string | null;
    homeGymName?: string | null;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  }) => apiClient.patch<ApiResponse<User>>('/users/me', data),
};

export type FitRating = 'good' | 'bad';

export interface RecommendationFeedbackInput {
  recommendationId: string;
  fitRating: FitRating;
}

export interface MachinePreferenceInput {
  machineCode: string;
  customSettings: Partial<RecommendationSettings>;
}

export const recommendationFeedbackApi = {
  async submit(input: RecommendationFeedbackInput): Promise<{ fitRating: FitRating }> {
    const res = await apiClient.post<ApiResponse<{ fitRating: FitRating }>>(
      '/recommendations/feedback',
      input
    );
    return res.data.data;
  },
  async get(recommendationId: string): Promise<FitRating | null> {
    const res = await apiClient.get<ApiResponse<{ fitRating: FitRating | null }>>(
      `/recommendations/${recommendationId}/feedback`
    );
    return res.data.data.fitRating;
  },
};

export const machinePreferenceApi = {
  async upsert(input: MachinePreferenceInput): Promise<MachinePreferenceInput> {
    const res = await apiClient.put<ApiResponse<MachinePreferenceInput>>(
      `/machines/${encodeURIComponent(input.machineCode)}/preferences`,
      { customSettings: input.customSettings }
    );
    return res.data.data;
  },
  async get(machineCode: string): Promise<Partial<RecommendationSettings> | null> {
    const res = await apiClient.get<ApiResponse<{ customSettings: Partial<RecommendationSettings> }>>(
      `/machines/${encodeURIComponent(machineCode)}/preferences`
    );
    return res.data.data.customSettings;
  },
};

export type WorkoutReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface WorkoutReportRequest {
  period: WorkoutReportPeriod;
  previewOnly?: boolean;
}

export interface WorkoutReportResult {
  message: string;
  emailSent: boolean;
  emailMethod?: string;
  emailError?: string;
  reportHtml?: string;
  reportSubject?: string;
  reportText?: string;
}

export const workoutReportApi = {
  send: (body: WorkoutReportRequest) =>
    apiClient.post<ApiResponse<WorkoutReportResult>>('/users/me/workout-reports', body),
};

export interface FavoriteItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  muscleGroup?: string;
  recommendationId?: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  muscleGroup?: string;
  targetMuscleGroup?: string;
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
    apiClient.get<ApiResponse<{ favorited: boolean; favoriteId?: string }>>(
      `/favorites/check/${machineCode}`
    ),
};

export const historyApi = {
  list: (params?: { machineCode?: string; limit?: number; from?: string; to?: string }) =>
    apiClient.get<ApiResponse<HistoryItem[]>>('/history', { params }),
  clear: () => apiClient.delete('/history'),
  remove: (id: string) => apiClient.delete(`/history/${id}`),
};

export const workoutLogApi = {
  list: (params?: {
    machineCode?: string;
    logDate?: string;
    from?: string;
    to?: string;
    targetMuscleGroup?: string;
  }) => apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', { params }),
  upsert: (body: UpsertWorkoutLogInput) =>
    apiClient.put<ApiResponse<WorkoutLog>>('/workout-logs', body),
  remove: (body: { machineCode: string; logDate: string; targetMuscleGroup?: string }) =>
    apiClient.delete<ApiResponse<{ message: string }>>('/workout-logs', { data: body }),
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

export interface QrResolveResult {
  machineCode: string;
  deepLinkPath: string;
  machineId: string;
}

export const qrApi = {
  resolve: (qrCode: string) =>
    apiClient.get<ApiResponse<QrResolveResult>>(`/qr/${encodeURIComponent(qrCode)}`),
  scan: (qrCode: string, body?: { sessionId?: string }) =>
    apiClient.post<ApiResponse<QrResolveResult>>(`/qr/${encodeURIComponent(qrCode)}/scan`, body ?? {}),
};

export { communityApi, machineRequestApi, ownerApi } from './community.api';
export type { OwnerDashboardStats, OwnerApplyResult } from './community.api';
export { adminApi, notificationApi } from './admin.api';
export type { AdminDashboardStats, AdminUserSummary } from './admin.api';
