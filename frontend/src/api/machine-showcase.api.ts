import type {
  ApiResponse,
  ClaimGymMachineInput,
  CreateMachineShowcaseCommentInput,
  CreateMachineShowcaseReportInput,
  MachineDexSummary,
  MachineGymsResponse,
  MachineRarityAdmin,
  MachineRarityPublic,
  MachineShowcaseComment,
  MachineShowcaseCreateResult,
  MachineShowcaseListQuery,
  MachineShowcasePost,
  MachineShowcasePostDetail,
  MachineShowcaseReport,
  PaginatedResponse,
  UpdateMachineShowcasePostInput,
  UserGymHoldingsSummary,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const machineShowcaseApi = {
  list: (params?: Partial<MachineShowcaseListQuery>) =>
    apiClient.get<
      ApiResponse<PaginatedResponse<MachineShowcasePost> & { locationRequired?: boolean }>
    >('/community/machine-showcase/posts', { params }),

  get: (postId: string) =>
    apiClient.get<ApiResponse<MachineShowcasePostDetail>>(
      `/community/machine-showcase/posts/${postId}`
    ),

  create: (input: {
    machineCode: string;
    caption: string;
    tags: string[];
    userGymId?: string;
    gymId?: string;
    files: File[];
  }) => {
    const form = new FormData();
    form.append('machineCode', input.machineCode);
    form.append('caption', input.caption);
    form.append('tags', JSON.stringify(input.tags));
    if (input.userGymId) form.append('userGymId', input.userGymId);
    if (input.gymId) form.append('gymId', input.gymId);
    for (const file of input.files) form.append('images', file);
    return apiClient.post<ApiResponse<MachineShowcaseCreateResult>>(
      '/community/machine-showcase/posts',
      form,
      { headers: { 'Content-Type': undefined }, timeout: 120_000 }
    );
  },

  update: (postId: string, input: UpdateMachineShowcasePostInput) =>
    apiClient.patch<ApiResponse<MachineShowcasePostDetail>>(
      `/community/machine-showcase/posts/${postId}`,
      input
    ),

  remove: (postId: string) =>
    apiClient.delete(`/community/machine-showcase/posts/${postId}`),

  like: (postId: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/community/machine-showcase/posts/${postId}/like`
    ),

  unlike: (postId: string) =>
    apiClient.delete<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/community/machine-showcase/posts/${postId}/like`
    ),

  bookmark: (postId: string) =>
    apiClient.post<ApiResponse<{ bookmarked: boolean; bookmarkCount: number }>>(
      `/community/machine-showcase/posts/${postId}/bookmark`
    ),

  unbookmark: (postId: string) =>
    apiClient.delete<ApiResponse<{ bookmarked: boolean; bookmarkCount: number }>>(
      `/community/machine-showcase/posts/${postId}/bookmark`
    ),

  createComment: (postId: string, input: CreateMachineShowcaseCommentInput) =>
    apiClient.post<ApiResponse<MachineShowcaseComment>>(
      `/community/machine-showcase/posts/${postId}/comments`,
      input
    ),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/community/machine-showcase/comments/${commentId}`),

  report: (input: CreateMachineShowcaseReportInput) =>
    apiClient.post<ApiResponse<MachineShowcaseReport>>(
      '/community/machine-showcase/reports',
      input
    ),

  claimGymMachine: (input: ClaimGymMachineInput) =>
    apiClient.post<ApiResponse<{ inserted: boolean; rarity: MachineRarityPublic }>>(
      `/community/machine-showcase/gyms/${input.userGymId}/machines/${encodeURIComponent(input.machineCode)}`,
      { sourcePostId: input.sourcePostId }
    ),

  machineGyms: (machineCode: string) =>
    apiClient.get<ApiResponse<MachineGymsResponse>>(
      `/community/machine-showcase/machines/${encodeURIComponent(machineCode)}/gyms`
    ),

  rarity: (machineCode: string) =>
    apiClient.get<ApiResponse<MachineRarityPublic>>(
      `/community/machine-showcase/machines/${encodeURIComponent(machineCode)}/rarity`
    ),

  myDex: () =>
    apiClient.get<ApiResponse<MachineDexSummary>>('/community/machine-showcase/my-dex'),

  myGymHoldings: (userGymId: string) =>
    apiClient.get<ApiResponse<UserGymHoldingsSummary>>(
      '/community/machine-showcase/my-gym-holdings',
      { params: { userGymId } }
    ),

  adminListReports: () =>
    apiClient.get<ApiResponse<MachineShowcaseReport[]>>(
      '/community/machine-showcase/admin/reports'
    ),

  adminResolveReport: (reportId: string, status: 'resolved' | 'dismissed') =>
    apiClient.patch(`/community/machine-showcase/admin/reports/${reportId}`, { status }),

  adminHidePost: (postId: string) =>
    apiClient.delete(`/community/machine-showcase/admin/posts/${postId}`),

  adminPatchPost: (postId: string, body: { isHidden?: boolean; machineCode?: string; gymId?: string | null }) =>
    apiClient.patch(`/community/machine-showcase/admin/posts/${postId}`, body),

  adminListRarity: (params?: { page?: number; q?: string; grade?: string }) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineRarityAdmin>>>(
      '/community/machine-showcase/admin/rarity',
      { params }
    ),

  adminPatchRarity: (
    machineCode: string,
    body: { adminWeight?: number; uniqueFlag?: boolean; gradeOverride?: string | null }
  ) =>
    apiClient.patch<ApiResponse<MachineRarityPublic>>(
      `/community/machine-showcase/admin/rarity/${encodeURIComponent(machineCode)}`,
      body
    ),
};
