import type {
  Post,
  Comment,
  MachineRequest,
  MachineRequestComment,
  MachineRequestDetail,
  MachineRequestSimilarGroup,
  Gym,
  GymMachine,
  PaginatedResponse,
} from '@machinefit/shared';
import type {
  CreatePostInput,
  CreateCommentInput,
  CreateMachineRequestInput,
  UpdateMachineRequestInput,
  MachineRequestListQuery,
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

  reportPost: (postId: string, input: { reason: string; description?: string }) =>
    apiClient.post<ApiResponse<{ id: string }>>(`/community/posts/${postId}/report`, input),

  reportComment: (commentId: string, input: { reason: string; description?: string }) =>
    apiClient.post<ApiResponse<{ id: string }>>(`/community/comments/${commentId}/report`, input),
};

export type CreateMachineRequestFormInput = CreateMachineRequestInput & {
  files: File[];
};

export const machineRequestApi = {
  list: (params?: Partial<MachineRequestListQuery> & { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineRequest>>>('/machine-requests', {
      params: {
        ...params,
        mine: params?.mine ? '1' : undefined,
        likedByMe: params?.likedByMe ? '1' : undefined,
        includeClosed: params?.includeClosed ? '1' : undefined,
      },
    }),

  get: (requestId: string) =>
    apiClient.get<ApiResponse<MachineRequestDetail>>(`/machine-requests/${requestId}`),

  similar: (params: { brandName?: string; machineName?: string }) =>
    apiClient.get<ApiResponse<MachineRequestSimilarGroup[]>>('/machine-requests/similar', {
      params,
    }),

  create: (input: CreateMachineRequestFormInput) => {
    const form = new FormData();
    form.append('brandName', input.brandName);
    form.append('machineName', input.machineName);
    form.append('description', input.description);
    form.append('commercialUseConsent', String(input.commercialUseConsent));
    form.append('gymChoiceMode', input.gymChoiceMode);
    if (input.gymName != null && input.gymName !== '') {
      form.append('gymName', input.gymName);
    }
    for (const file of input.files) {
      form.append('images', file);
    }
    return apiClient.post<ApiResponse<MachineRequest>>('/machine-requests', form, {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
    });
  },

  update: (requestId: string, input: UpdateMachineRequestInput) =>
    apiClient.patch<ApiResponse<MachineRequest>>(`/machine-requests/${requestId}`, input),

  remove: (requestId: string) => apiClient.delete(`/machine-requests/${requestId}`),

  toggleLike: (requestId: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/machine-requests/${requestId}/like`
    ),

  toggleVote: (requestId: string) =>
    apiClient.post<ApiResponse<{ voted: boolean; voteCount: number }>>(
      `/machine-requests/${requestId}/vote`
    ),

  createComment: (requestId: string, input: CreateCommentInput) =>
    apiClient.post<ApiResponse<MachineRequestComment>>(
      `/machine-requests/${requestId}/comments`,
      input
    ),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/machine-requests/comments/${commentId}`),
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
  tokens?: { accessToken: string; refreshToken?: string; expiresIn: string };
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
