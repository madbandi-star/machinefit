import type {
  AdminUserPointsDetail,
  PointAwardResult,
  PointClientTrackableAction,
  PointPolicy,
  PointPolicyUpdateInput,
  PointTransaction,
  PowerBoxClaimResult,
  PowerBoxStatus,
  UserPointsSummary,
} from '@machinefit/shared';
import type { ApiResponse } from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const pointsApi = {
  getMine: () => apiClient.get<ApiResponse<UserPointsSummary>>('/points/me'),
  ledger: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: PointTransaction[]; limit: number; offset: number }>>(
      '/points/me/ledger',
      { params }
    ),
  track: (body: {
    actionCode: PointClientTrackableAction;
    referenceType?: string;
    referenceId?: string;
  }) => apiClient.post<ApiResponse<PointAwardResult>>('/points/track', body),
  getPowerBox: () => apiClient.get<ApiResponse<PowerBoxStatus>>('/points/power-box'),
  claimPowerBox: () =>
    apiClient.post<ApiResponse<PowerBoxClaimResult>>('/points/power-box/claim'),
};

export const adminPointsApi = {
  listPolicies: () =>
    apiClient.get<ApiResponse<PointPolicy[]>>('/admin/points/policies'),
  updatePolicy: (policyId: string, body: PointPolicyUpdateInput) =>
    apiClient.put<ApiResponse<PointPolicy>>(`/admin/points/policies/${policyId}`, body),
  listUsers: (q?: string) =>
    apiClient.get<
      ApiResponse<
        Array<{
          userId: string;
          email: string | null;
          displayName: string | null;
          balance: number;
          lifetimeEarned: number;
          lifetimeSpent: number;
          updatedAt: string;
        }>
      >
    >('/admin/points/users', { params: { q } }),
  getUser: (userId: string) =>
    apiClient.get<ApiResponse<AdminUserPointsDetail>>(`/admin/points/users/${userId}`),
  adjust: (body: {
    userId: string;
    points: number;
    direction: 'grant' | 'deduct';
    description: string;
  }) =>
    apiClient.post<
      ApiResponse<{ summary: UserPointsSummary; tx: PointTransaction }>
    >('/admin/points/adjust', body),
};
