import type {
  Notification,
  PaginatedResponse,
  Post,
  MachineRequest,
  Report,
  Gym,
  Brand,
  Machine,
  User,
  MotivationMediaAdminState,
  MotivationPlaylist,
  ReplaceMotivationMediaInput,
  OwnerApplication,
  TrainerApplication,
  GymMachine,
  ReviewOwnerApplicationInput,
  ReviewTrainerApplicationInput,
  AdminGymMachineActionInput,
  MuscleGroupImageAsset,
  MuscleGroupImagesState,
  MuscleGroupImageKey,
  MachineCoverImageAsset,
  MachineCoverImagesPage,
  MachineCoverBrandOption,
} from '@machinefit/shared';
import type {
  UpdateUserAdminInput,
  ModeratePostInput,
  VerifyGymInput,
  UpdateMachineRequestAdminInput,
  ResolveReportInput,
  ToggleActiveInput,
  AdminBrandUpsertInput,
  AdminMachineUpsertInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { ApiResponse } from '@machinefit/shared';

export interface AdminDashboardStats {
  userCount: number;
  gymCount: number;
  machineCount: number;
  brandCount: number;
  postCount: number;
  pendingRequests: number;
  pendingReports: number;
  hiddenPosts: number;
  verifiedGyms: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  roleCode: string;
  isActive: boolean;
  createdAt: string;
}

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params }),

  unreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all'),
};

export const adminApi = {
  dashboard: () =>
    apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard'),

  listUsers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<AdminUserSummary>>>('/admin/users', { params }),

  updateUser: (id: string, input: UpdateUserAdminInput) =>
    apiClient.patch<ApiResponse<User>>(`/admin/users/${id}`, input),

  listGyms: () =>
    apiClient.get<ApiResponse<Gym[]>>('/admin/gyms'),

  verifyGym: (id: string, input: VerifyGymInput) =>
    apiClient.patch<ApiResponse<Gym>>(`/admin/gyms/${id}/verify`, input),

  listBrands: () =>
    apiClient.get<ApiResponse<Brand[]>>('/admin/brands'),

  updateBrand: (id: string, input: ToggleActiveInput) =>
    apiClient.patch<ApiResponse<Brand>>(`/admin/brands/${id}`, input),

  listMachines: () =>
    apiClient.get<ApiResponse<Machine[]>>('/admin/machines'),

  updateMachine: (id: string, input: ToggleActiveInput) =>
    apiClient.patch<ApiResponse<Machine>>(`/admin/machines/${id}`, input),

  listCatalogBrands: (params?: {
    q?: string;
    sort?: 'name' | 'createdAt' | 'sortOrder';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    isActive?: 'true' | 'false' | 'all';
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Brand>>>('/admin/catalog/brands', { params }),

  createCatalogBrand: (input: AdminBrandUpsertInput) =>
    apiClient.post<ApiResponse<Brand>>('/admin/catalog/brands', input),

  updateCatalogBrand: (id: string, input: AdminBrandUpsertInput) =>
    apiClient.patch<ApiResponse<Brand>>(`/admin/catalog/brands/${id}`, input),

  setCatalogBrandActive: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<Brand>>(`/admin/catalog/brands/${id}/active`, { isActive }),

  deleteCatalogBrand: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: true }>>(`/admin/catalog/brands/${id}`),

  uploadCatalogBrandLogo: (id: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<Brand>>(`/admin/catalog/brands/${id}/logo`, form, {
      // Let the browser set multipart boundary; a bare multipart header breaks uploads.
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
  },

  clearCatalogBrandLogo: (id: string) =>
    apiClient.delete<ApiResponse<Brand>>(`/admin/catalog/brands/${id}/logo`),

  uploadCatalogBrandImage: (id: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<Brand>>(`/admin/catalog/brands/${id}/image`, form, {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
  },

  clearCatalogBrandImage: (id: string) =>
    apiClient.delete<ApiResponse<Brand>>(`/admin/catalog/brands/${id}/image`),

  listCatalogMachines: (params?: {
    q?: string;
    brandId?: string;
    brandCode?: string;
    muscleGroup?: string;
    isActive?: 'true' | 'false' | 'all';
    sort?: 'name' | 'createdAt' | 'sortOrder' | 'code';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Machine>>>('/admin/catalog/machines', { params }),

  createCatalogMachine: (input: AdminMachineUpsertInput) =>
    apiClient.post<ApiResponse<Machine>>('/admin/catalog/machines', input),

  updateCatalogMachine: (id: string, input: AdminMachineUpsertInput) =>
    apiClient.patch<ApiResponse<Machine>>(`/admin/catalog/machines/${id}`, input),

  setCatalogMachineActive: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<Machine>>(`/admin/catalog/machines/${id}/active`, { isActive }),

  deleteCatalogMachine: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean; deactivated: boolean }>>(
      `/admin/catalog/machines/${id}`
    ),

  uploadCatalogMachineImage: (id: string, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<Machine>>(`/admin/catalog/machines/${id}/image`, form, {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
  },

  clearCatalogMachineImage: (id: string) =>
    apiClient.delete<ApiResponse<Machine>>(`/admin/catalog/machines/${id}/image`),

  listPosts: () =>
    apiClient.get<ApiResponse<Post[]>>('/admin/posts'),

  moderatePost: (id: string, input: ModeratePostInput) =>
    apiClient.patch<ApiResponse<Post>>(`/admin/posts/${id}`, input),

  listMachineRequests: () =>
    apiClient.get<ApiResponse<MachineRequest[]>>('/admin/machine-requests'),

  updateMachineRequest: (id: string, input: UpdateMachineRequestAdminInput) =>
    apiClient.patch<ApiResponse<MachineRequest>>(`/admin/machine-requests/${id}`, input),

  listReports: () =>
    apiClient.get<ApiResponse<Report[]>>('/admin/reports'),

  resolveReport: (id: string, input: ResolveReportInput) =>
    apiClient.patch<ApiResponse<Report>>(`/admin/reports/${id}`, input),

  listMotivationMedia: () =>
    apiClient.get<ApiResponse<MotivationMediaAdminState>>('/admin/motivation-media'),

  replaceMotivationMedia: (input: ReplaceMotivationMediaInput) =>
    apiClient.put<
      ApiResponse<{ mediaType: ReplaceMotivationMediaInput['mediaType']; items: MotivationMediaAdminState['music'] }>
    >('/admin/motivation-media', input),

  uploadMotivationAudio: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<
      ApiResponse<{
        mediaUrl: string;
        storagePath: string;
        originalFilename: string;
        mimeType: string | null;
        fileSizeBytes: number;
      }>
    >('/admin/motivation-media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
  },

  listOwnerApplications: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<OwnerApplication[]>>('/admin/owner-applications', { params }),

  reviewOwnerApplication: (id: string, input: ReviewOwnerApplicationInput) =>
    apiClient.patch<ApiResponse<OwnerApplication>>(`/admin/owner-applications/${id}`, input),

  listTrainerApplications: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<TrainerApplication[]>>('/admin/trainer-applications', { params }),

  reviewTrainerApplication: (id: string, input: ReviewTrainerApplicationInput) =>
    apiClient.patch<ApiResponse<TrainerApplication>>(`/admin/trainer-applications/${id}`, input),

  listGymInventory: (gymId: string, params?: { includeDeleted?: boolean }) =>
    apiClient.get<ApiResponse<GymMachine[]>>(`/admin/gyms/${gymId}/inventory`, { params }),

  gymMachineAction: (itemId: string, input: AdminGymMachineActionInput) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/gym-machines/${itemId}/actions`,
      input
    ),

  listMuscleGroupImages: () =>
    apiClient.get<ApiResponse<MuscleGroupImagesState>>('/admin/muscle-group-images'),

  uploadMuscleGroupImage: async (
    muscleGroup: MuscleGroupImageKey,
    file: File,
    onProgress?: (percent: number) => void
  ) => {
    const { compressImageForUpload } = await import('@/utils/compressImageForUpload');
    const prepared = await compressImageForUpload(file);
    const form = new FormData();
    form.append('file', prepared);
    return apiClient.post<ApiResponse<MuscleGroupImageAsset>>(
      `/admin/muscle-group-images/${encodeURIComponent(muscleGroup)}/upload`,
      form,
      {
        timeout: 180_000,
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        },
      }
    );
  },

  deleteMuscleGroupImage: (muscleGroup: MuscleGroupImageKey) =>
    apiClient.delete<ApiResponse<MuscleGroupImageAsset>>(
      `/admin/muscle-group-images/${encodeURIComponent(muscleGroup)}`
    ),

  listMachineCoverBrands: () =>
    apiClient.get<ApiResponse<{ brands: MachineCoverBrandOption[] }>>('/admin/machine-covers/brands'),

  listMachineCovers: (params?: {
    q?: string;
    brandCode?: string;
    page?: number;
    pageSize?: number;
  }) =>
    apiClient.get<ApiResponse<MachineCoverImagesPage>>('/admin/machine-covers', { params }),

  uploadMachineCover: async (
    machineCode: string,
    file: File,
    onProgress?: (percent: number) => void,
    targetMuscle?: string
  ) => {
    const { compressImageForUpload } = await import('@/utils/compressImageForUpload');
    const prepared = await compressImageForUpload(file);
    const form = new FormData();
    form.append('file', prepared);
    const path = targetMuscle
      ? `/admin/machine-covers/${encodeURIComponent(machineCode)}/muscles/${encodeURIComponent(targetMuscle)}/upload`
      : `/admin/machine-covers/${encodeURIComponent(machineCode)}/upload`;
    return apiClient.post<ApiResponse<MachineCoverImageAsset>>(path, form, {
      // Do NOT set Content-Type — browser must add multipart boundary.
      timeout: 180_000,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      },
    });
  },

  deleteMachineCover: (machineCode: string, targetMuscle?: string) =>
    apiClient.delete<
      ApiResponse<{ machineCode: string; targetMuscle: string | null; deleted: boolean }>
    >(
      targetMuscle
        ? `/admin/machine-covers/${encodeURIComponent(machineCode)}/muscles/${encodeURIComponent(targetMuscle)}`
        : `/admin/machine-covers/${encodeURIComponent(machineCode)}`
    ),
};

export const motivationMediaApi = {
  playlist: () =>
    apiClient.get<ApiResponse<MotivationPlaylist>>('/motivation-media'),
};

export const muscleGroupImageApi = {
  list: () =>
    apiClient.get<ApiResponse<MuscleGroupImagesState>>('/muscle-group-images'),
};
