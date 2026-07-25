import type {
  ApiResponse,
  BlockedUserItem,
  CreateFriendRequestInput,
  FriendActivityItem,
  FriendAdminStats,
  FriendInviteInfo,
  FriendListItem,
  FriendPrivacySettings,
  FriendProfile,
  FriendRankingMetric,
  FriendRankingRow,
  FriendRequestItem,
  FriendSort,
  FriendUserSummary,
  UpdateFriendPrivacyInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

type PageResult<T> = { items: T[]; total: number };

export const friendsApi = {
  list: (params?: { q?: string; sort?: FriendSort; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendListItem>>>('/friends', { params }),

  search: (params: { q: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendUserSummary>>>('/friends/search', { params }),

  getPrivacy: () =>
    apiClient.get<ApiResponse<FriendPrivacySettings>>('/friends/privacy'),

  updatePrivacy: (body: UpdateFriendPrivacyInput) =>
    apiClient.put<ApiResponse<FriendPrivacySettings>>('/friends/privacy', body),

  incoming: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendRequestItem>>>('/friends/requests/incoming', {
      params,
    }),

  outgoing: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendRequestItem>>>('/friends/requests/outgoing', {
      params,
    }),

  sendRequest: (body: CreateFriendRequestInput) =>
    apiClient.post<ApiResponse<{ autoAccepted: boolean; request?: FriendRequestItem }>>(
      '/friends/friend-request',
      body
    ),

  accept: (requestId: string) =>
    apiClient.post<ApiResponse<FriendRequestItem>>(`/friends/friend-accept/${requestId}`),

  reject: (requestId: string) =>
    apiClient.post<ApiResponse<FriendRequestItem>>(`/friends/friend-reject/${requestId}`),

  cancelRequest: (requestId: string) =>
    apiClient.delete<ApiResponse<{ success: boolean }>>(`/friends/requests/${requestId}`),

  remove: (friendUserId: string) =>
    apiClient.delete<ApiResponse<{ success: boolean }>>('/friends/friend', {
      data: { friendUserId },
    }),

  setPin: (friendUserId: string, pinned: boolean) =>
    apiClient.post<ApiResponse<{ success: boolean; pinned: boolean }>>('/friends/pin', {
      friendUserId,
      pinned,
    }),

  block: (targetUserId: string, reason = '') =>
    apiClient.post<ApiResponse<{ success: boolean }>>('/friends/friend-block', {
      targetUserId,
      reason,
    }),

  unblock: (targetUserId: string) =>
    apiClient.delete<ApiResponse<{ success: boolean }>>('/friends/friend-block', {
      data: { targetUserId },
    }),

  listBlocked: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<BlockedUserItem>>>('/friends/blocked', { params }),

  profile: (userId: string) =>
    apiClient.get<ApiResponse<FriendProfile>>(`/friends/profile/${userId}`),

  feed: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendActivityItem>>>('/friends/feed', { params }),

  rankings: (params: { metric: FriendRankingMetric; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PageResult<FriendRankingRow>>>('/friends/rankings', { params }),

  invite: () => apiClient.get<ApiResponse<FriendInviteInfo>>('/friends/invite'),

  applyInvite: (code: string) =>
    apiClient.post<ApiResponse<{ success: boolean }>>('/friends/invite/apply', { code }),

  report: (body: {
    reportedUserId: string;
    reason: 'spam' | 'abuse' | 'fake' | 'other';
    description?: string | null;
  }) => apiClient.post<ApiResponse<unknown>>('/friends/report', body),

  adminStats: () =>
    apiClient.get<ApiResponse<FriendAdminStats>>('/friends/admin/stats'),

  adminFriendships: (params?: { page?: number; limit?: number }) =>
    apiClient.get<
      ApiResponse<
        PageResult<{
          id: string;
          userLowId: string;
          userHighId: string;
          lowName: string;
          highName: string;
          createdAt: string;
        }>
      >
    >('/friends/admin/friendships', { params }),

  adminDeleteFriendship: (id: string) =>
    apiClient.delete<ApiResponse<{ success: boolean }>>(`/friends/admin/friendships/${id}`),

  adminReports: () =>
    apiClient.get<
      ApiResponse<
        Array<{
          id: string;
          reporterId: string;
          reportedUserId: string;
          reason: string;
          description: string | null;
          status: string;
          createdAt: string;
        }>
      >
    >('/friends/admin/reports'),

  adminResolveReport: (id: string, status: 'resolved' | 'dismissed') =>
    apiClient.patch<ApiResponse<{ success: boolean }>>(`/friends/admin/reports/${id}`, {
      status,
    }),

  adminSpam: () =>
    apiClient.get<
      ApiResponse<
        Array<{
          userId: string;
          displayName: string;
          email: string;
          requestCount: number;
          lastRequestAt: string | null;
        }>
      >
    >('/friends/admin/spam'),

  adminBlock: (targetUserId: string, reason?: string) =>
    apiClient.post<ApiResponse<{ success: boolean }>>('/friends/admin/block', {
      targetUserId,
      reason,
    }),
};
