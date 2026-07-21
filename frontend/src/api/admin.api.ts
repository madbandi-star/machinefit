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
  GymMachine,
  ReviewOwnerApplicationInput,
  AdminGymMachineActionInput,
} from '@machinefit/shared';
import type {
  UpdateUserAdminInput,
  ModeratePostInput,
  VerifyGymInput,
  UpdateMachineRequestAdminInput,
  ResolveReportInput,
  ToggleActiveInput,
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

  listOwnerApplications: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<OwnerApplication[]>>('/admin/owner-applications', { params }),

  reviewOwnerApplication: (id: string, input: ReviewOwnerApplicationInput) =>
    apiClient.patch<ApiResponse<OwnerApplication>>(`/admin/owner-applications/${id}`, input),

  listGymInventory: (gymId: string, params?: { includeDeleted?: boolean }) =>
    apiClient.get<ApiResponse<GymMachine[]>>(`/admin/gyms/${gymId}/inventory`, { params }),

  gymMachineAction: (itemId: string, input: AdminGymMachineActionInput) =>
    apiClient.post<ApiResponse<{ message: string }>>(
      `/admin/gym-machines/${itemId}/actions`,
      input
    ),
};

export const motivationMediaApi = {
  playlist: () =>
    apiClient.get<ApiResponse<MotivationPlaylist>>('/motivation-media'),
};
