import type { Post, Comment, MachineRequest, Gym, GymMachine, PaginatedResponse } from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  OwnerApplicationInput,
  CreateOwnerGymInput,
  AddGymMachineInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';
import type { ApiResponse } from '@machinefit/shared';

export const communityApi = {
  listPosts: (params?: { boardType?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<Post>>>('/community/posts', { params }),

  getPost: (postId: string) =>
    apiClient.get<ApiResponse<{ post: Post; comments: Comment[] }>>(`/community/posts/${postId}`),

  createPost: (input: CreatePostInput) =>
    apiClient.post<ApiResponse<Post>>('/community/posts', input),

  deletePost: (postId: string) =>
    apiClient.delete(`/community/posts/${postId}`),

  createComment: (postId: string, input: CreateCommentInput) =>
    apiClient.post<ApiResponse<Comment>>(`/community/posts/${postId}/comments`, input),

  toggleLike: (postId: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(`/community/posts/${postId}/like`),
};

export const machineRequestApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineRequest>>>('/machine-requests', { params }),

  create: (input: CreateMachineRequestInput) =>
    apiClient.post<ApiResponse<MachineRequest>>('/machine-requests', input),
};

export interface OwnerDashboardStats {
  gymCount: number;
  machineCount: number;
  verifiedCount: number;
}

export interface OwnerApplyResult {
  approved: boolean;
  pending?: boolean;
  message: string;
  application?: unknown;
  tokens?: { accessToken: string; refreshToken: string; expiresIn: string };
  user: { roleCode: string } | null;
}

export const ownerApi = {
  apply: (input: OwnerApplicationInput) =>
    apiClient.post<ApiResponse<OwnerApplyResult>>('/owner/apply', input),

  dashboard: () =>
    apiClient.get<ApiResponse<OwnerDashboardStats>>('/owner/dashboard'),

  listGyms: () =>
    apiClient.get<ApiResponse<Gym[]>>('/owner/gyms'),

  createGym: (input: CreateOwnerGymInput) =>
    apiClient.post<ApiResponse<Gym>>('/owner/gyms', input),

  getGymMachines: (gymId: string) =>
    apiClient.get<ApiResponse<GymMachine[]>>(`/owner/gyms/${gymId}/machines`),

  addGymMachine: (gymId: string, input: AddGymMachineInput) =>
    apiClient.post<ApiResponse<GymMachine>>(`/owner/gyms/${gymId}/machines`, input),

  removeGymMachine: (gymId: string, itemId: string) =>
    apiClient.delete(`/owner/gyms/${gymId}/machines/${itemId}`),
};
