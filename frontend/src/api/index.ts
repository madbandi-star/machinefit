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
  UserGym,
  Gender,
  WorkoutGoal,
  WorkoutLog,
  UpsertWorkoutLogInput,
  CreateUserGymInput,
  UpdateUserGymInput,
  GymMember,
  GymMemberProfileRequest,
  LiftedWeightSnapshot,
  LiftedRankingResponse,
  LiftedScopeMode,
  LiftedRankingBoard,
  LifterDnaSnapshot,
  AchievementSnapshot,
  AchievementRankingResponse,
  GrowthTimelineSnapshot,
  LocationCountry,
  LocationState,
  LocationCity,
  LocationDistrict,
  UserLocation,
  ReverseGeocodeResult,
  UserLocationUpsertInput,
  LiveDashboardSnapshot,
  LiveRankingResponse,
  LiveRankingBoard,
  LiveRankingPeriod,
  LiveDashboardLevel,
  LiveScopeQuery,
  LiveSearchHit,
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
export type SettingsActiveSource = 'recommended' | 'adjusted';

export interface RecommendationFeedbackInput {
  recommendationId: string;
  fitRating: FitRating;
  gymId?: string;
  memberId?: string;
}

export interface MachinePreferenceInput {
  machineCode: string;
  customSettings?: Partial<RecommendationSettings>;
  personalTipMemo?: string;
  activeSource?: SettingsActiveSource;
  clearAdjusted?: boolean;
  gymId?: string;
  memberId?: string;
}

export interface MachinePreferencesResponse {
  customSettings: Partial<RecommendationSettings>;
  personalTipMemo: string;
  activeSource: SettingsActiveSource;
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
  async getBatch(recommendationIds: string[]): Promise<Record<string, FitRating | null>> {
    if (recommendationIds.length === 0) return {};

    const res = await apiClient.get<ApiResponse<Record<string, FitRating | null>>>(
      '/recommendations/feedback/batch',
      {
        params: { ids: recommendationIds.join(',') },
      }
    );
    return res.data.data;
  },
};

export const machinePreferenceApi = {
  async upsert(input: MachinePreferenceInput): Promise<
    MachinePreferencesResponse & { machineCode: string }
  > {
    const body: {
      customSettings?: Partial<RecommendationSettings>;
      personalTipMemo?: string;
      activeSource?: SettingsActiveSource;
      clearAdjusted?: boolean;
      gymId?: string;
      memberId?: string;
    } = {};
    if (input.customSettings !== undefined) {
      body.customSettings = input.customSettings;
    }
    if (input.personalTipMemo !== undefined) {
      body.personalTipMemo = input.personalTipMemo;
    }
    if (input.activeSource !== undefined) {
      body.activeSource = input.activeSource;
    }
    if (input.clearAdjusted !== undefined) {
      body.clearAdjusted = input.clearAdjusted;
    }
    if (input.gymId) body.gymId = input.gymId;
    if (input.memberId) body.memberId = input.memberId;
    const res = await apiClient.put<
      ApiResponse<MachinePreferencesResponse & { machineCode: string }>
    >(`/machines/${encodeURIComponent(input.machineCode)}/preferences`, body);
    return res.data.data;
  },
  async get(
    machineCode: string,
    scope?: { gymId?: string; memberId?: string }
  ): Promise<MachinePreferencesResponse> {
    const res = await apiClient.get<ApiResponse<MachinePreferencesResponse>>(
      `/machines/${encodeURIComponent(machineCode)}/preferences`,
      {
        params: {
          ...(scope?.gymId ? { gymId: scope.gymId } : {}),
          ...(scope?.memberId ? { memberId: scope.memberId } : {}),
        },
      }
    );
    return res.data.data;
  },
  async getBatch(
    machineCodes: string[],
    scope?: { gymId?: string; memberId?: string }
  ): Promise<Record<string, MachinePreferencesResponse | null>> {
    if (machineCodes.length === 0) return {};

    const res = await apiClient.get<
      ApiResponse<Record<string, MachinePreferencesResponse | null>>
    >('/machines/preferences', {
      params: {
        codes: machineCodes.join(','),
        ...(scope?.gymId ? { gymId: scope.gymId } : {}),
        ...(scope?.memberId ? { memberId: scope.memberId } : {}),
      },
    });
    return res.data.data;
  },
};

export type WorkoutReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface WorkoutReportRequest {
  period: WorkoutReportPeriod;
  previewOnly?: boolean;
  gymId?: string;
  memberId?: string;
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
  brandName?: string;
  muscleGroup?: string;
  recommendationId?: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  machineId: string;
  machineCode: string;
  machineName: string;
  brandName?: string;
  muscleGroup?: string;
  targetMuscleGroup?: string;
  recommendationId: string;
  settings: RecommendationResult['settings'];
  viewedAt: string;
}

export interface UserGymsResponse {
  items: UserGym[];
  activeGymId: string;
  activeGym: UserGym;
}

export const userGymApi = {
  list: () => apiClient.get<ApiResponse<UserGymsResponse>>('/users/me/gyms'),
  create: (body: CreateUserGymInput) =>
    apiClient.post<ApiResponse<UserGym>>('/users/me/gyms', body),
  update: (gymId: string, body: UpdateUserGymInput) =>
    apiClient.patch<ApiResponse<UserGym>>(`/users/me/gyms/${gymId}`, body),
  remove: (gymId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/users/me/gyms/${gymId}`),
  select: (gymId: string) =>
    apiClient.post<ApiResponse<UserGym>>(`/users/me/gyms/${gymId}/select`),
};

export const favoriteApi = {
  list: (gymId: string, memberId?: string) =>
    apiClient.get<ApiResponse<FavoriteItem[]>>('/favorites', {
      params: { gymId, ...(memberId ? { memberId } : {}) },
    }),
  add: (gymId: string, memberId: string, machineCode: string, recommendationId?: string) =>
    apiClient.post<ApiResponse<FavoriteItem>>('/favorites', {
      gymId,
      memberId,
      machineCode,
      recommendationId,
    }),
  remove: (id: string) => apiClient.delete(`/favorites/${id}`),
  check: (gymId: string, machineCode: string, memberId?: string) =>
    apiClient.get<ApiResponse<{ favorited: boolean; favoriteId?: string }>>(
      `/favorites/check/${machineCode}`,
      { params: { gymId, ...(memberId ? { memberId } : {}) } }
    ),
};

export const historyApi = {
  list: (
    gymId: string,
    params?: {
      machineCode?: string;
      limit?: number;
      from?: string;
      to?: string;
      memberId?: string;
    }
  ) => apiClient.get<ApiResponse<HistoryItem[]>>('/history', { params: { gymId, ...params } }),
  clear: (gymId: string, memberId?: string) =>
    apiClient.delete('/history', {
      params: { gymId, ...(memberId ? { memberId } : {}) },
    }),
  remove: (id: string) => apiClient.delete(`/history/${id}`),
};

export const workoutLogApi = {
  list: (params: {
    gymId: string;
    memberId?: string;
    machineCode?: string;
    logDate?: string;
    from?: string;
    to?: string;
    limit?: number;
    targetMuscleGroup?: string;
  }) => apiClient.get<ApiResponse<WorkoutLog[]>>('/workout-logs', { params }),
  upsert: (body: UpsertWorkoutLogInput) =>
    apiClient.put<ApiResponse<WorkoutLog>>('/workout-logs', body),
  remove: (body: {
    gymId: string;
    memberId: string;
    machineCode: string;
    logDate: string;
    targetMuscleGroup?: string;
  }) => apiClient.delete<ApiResponse<{ message: string }>>('/workout-logs', { data: body }),
};

export interface GymDetail extends Gym {
  photos: GymPhoto[];
  machines: GymMachine[];
}

export interface GymInventoryResponse {
  items: GymMachine[];
  capabilities: {
    canAdd: boolean;
    canManageOfficial: boolean;
    isGymOperator: boolean;
    roleCode?: string;
  };
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
  listInventory: (gymId: string, params?: { brandCode?: string; q?: string }) =>
    apiClient.get<ApiResponse<GymInventoryResponse>>(`/gyms/${gymId}/inventory`, { params }),
  addInventory: (
    gymId: string,
    input: { machineCode: string; quantity?: number; notes?: string; floorZone?: string }
  ) => apiClient.post<ApiResponse<GymMachine>>(`/gyms/${gymId}/inventory`, input),
  removeInventory: (gymId: string, itemId: string) =>
    apiClient.delete(`/gyms/${gymId}/inventory/${itemId}`),
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

export interface CreateGymMemberInput {
  name: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  memo?: string;
  email?: string;
}

export interface UpdateGymMemberInput {
  name?: string;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  birthDate?: string;
  memo?: string;
  email?: string;
}

export const gymMemberApi = {
  list: (gymId: string) =>
    apiClient.get<ApiResponse<GymMember[]>>(`/users/me/gyms/${gymId}/members`),
  create: (gymId: string, body: CreateGymMemberInput) =>
    apiClient.post<ApiResponse<GymMember>>(`/users/me/gyms/${gymId}/members`, body),
  update: (gymId: string, memberId: string, body: UpdateGymMemberInput) =>
    apiClient.patch<ApiResponse<GymMember>>(`/users/me/gyms/${gymId}/members/${memberId}`, body),
  remove: (gymId: string, memberId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/users/me/gyms/${gymId}/members/${memberId}`),
};

export const memberProfileRequestApi = {
  list: () =>
    apiClient.get<ApiResponse<GymMemberProfileRequest[]>>('/users/me/member-profile-requests'),
  respond: (id: string, status: 'approved' | 'denied') =>
    apiClient.post<ApiResponse<GymMemberProfileRequest>>(
      `/users/me/member-profile-requests/${id}/respond`,
      { status }
    ),
};

export const liftedWeightApi = {
  snapshot: (params: { mode: LiftedScopeMode; gymId?: string }) =>
    apiClient.get<ApiResponse<LiftedWeightSnapshot>>('/users/me/lifted-weight', { params }),
  rankings: (params: { board: LiftedRankingBoard; gymId?: string; limit?: number }) =>
    apiClient.get<ApiResponse<LiftedRankingResponse>>('/users/me/lifted-weight/rankings', {
      params,
    }),
};

export const lifterDnaApi = {
  snapshot: (params?: { gymId?: string; memberId?: string }) =>
    apiClient.get<ApiResponse<LifterDnaSnapshot>>('/users/me/lifter-dna', { params }),
};

export const achievementsApi = {
  snapshot: (params?: { gymId?: string; memberId?: string }) =>
    apiClient.get<ApiResponse<AchievementSnapshot>>('/users/me/achievements', { params }),
  rankings: (params?: { limit?: number }) =>
    apiClient.get<ApiResponse<AchievementRankingResponse>>('/users/me/achievements/rankings', {
      params,
    }),
};

export const growthTimelineApi = {
  snapshot: (params?: { gymId?: string; memberId?: string }) =>
    apiClient.get<ApiResponse<GrowthTimelineSnapshot>>('/users/me/growth-timeline', { params }),
};

export const locationApi = {
  countries: () => apiClient.get<ApiResponse<LocationCountry[]>>('/locations/countries'),
  states: (countryCode: string) =>
    apiClient.get<ApiResponse<LocationState[]>>(`/locations/countries/${countryCode}/states`),
  cities: (stateId: string) =>
    apiClient.get<ApiResponse<LocationCity[]>>(`/locations/states/${stateId}/cities`),
  districts: (cityId: string) =>
    apiClient.get<ApiResponse<LocationDistrict[]>>(`/locations/cities/${cityId}/districts`),
  reverseGeocode: (body: { latitude: number; longitude: number }) =>
    apiClient.post<ApiResponse<ReverseGeocodeResult | null>>('/locations/reverse-geocode', body),
  getMine: () => apiClient.get<ApiResponse<UserLocation>>('/locations/me'),
  upsertMine: (body: UserLocationUpsertInput) =>
    apiClient.put<ApiResponse<UserLocation>>('/locations/me', body),
  clearMine: () => apiClient.delete<ApiResponse<UserLocation>>('/locations/me'),
  adminUpsertCountry: (body: unknown) =>
    apiClient.post('/locations/admin/countries', body),
  adminUpsertState: (body: unknown) => apiClient.post('/locations/admin/states', body),
  adminUpsertCity: (body: unknown) => apiClient.post('/locations/admin/cities', body),
  adminUpsertDistrict: (body: unknown) => apiClient.post('/locations/admin/districts', body),
};

export const liveDashboardApi = {
  snapshot: (params: { level: LiveDashboardLevel } & LiveScopeQuery) =>
    apiClient.get<ApiResponse<LiveDashboardSnapshot>>('/live/snapshot', { params }),
  rankings: (
    params: {
      board: LiveRankingBoard;
      period?: LiveRankingPeriod;
      limit?: number;
    } & LiveScopeQuery
  ) => apiClient.get<ApiResponse<LiveRankingResponse>>('/live/rankings', { params }),
  search: (q: string) =>
    apiClient.get<ApiResponse<LiveSearchHit[]>>('/live/search', { params: { q } }),
};

export { communityApi, machineRequestApi, ownerApi } from './community.api';
export type { OwnerDashboardStats, OwnerApplyResult } from './community.api';
export { adminApi, notificationApi, motivationMediaApi } from './admin.api';
export type { AdminDashboardStats, AdminUserSummary } from './admin.api';
export { userMotivationTrackApi } from './user-motivation-track.api';
export type {
  MotivationTrackListResponse,
  MotivationUploadProgress,
} from './user-motivation-track.api';
