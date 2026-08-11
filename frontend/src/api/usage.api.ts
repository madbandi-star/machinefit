import type {
  AdminUsageSummary,
  AdminUsageTimeseriesPoint,
  AdminUsageUserDetail,
  AdminUsageUserListItem,
  ApiResponse,
  PaginatedResponse,
  UsageFeatureCode,
  UsageLimitCheckResult,
  UsagePolicy,
  UsagePolicyHistoryItem,
  UsagePolicyUpdateInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const usageApi = {
  track: (events: Array<{ featureCode: UsageFeatureCode; amount?: number }>) =>
    apiClient.post<ApiResponse<{ accepted: number }>>('/usage/track', { events }),

  check: (featureCode: string) =>
    apiClient.get<ApiResponse<UsageLimitCheckResult>>(`/usage/check/${featureCode}`),
};

export const adminUsageApi = {
  summary: () =>
    apiClient.get<ApiResponse<AdminUsageSummary>>('/admin/usage/summary'),

  timeseries: (params: { from: string; to: string }) =>
    apiClient.get<ApiResponse<AdminUsageTimeseriesPoint[]>>('/admin/usage/timeseries', {
      params,
    }),

  listUsers: (params?: { q?: string; page?: number; limit?: number }) =>
    apiClient.get<
      ApiResponse<{ total: number; items: AdminUsageUserListItem[] }>
    >('/admin/usage/users', { params }),

  getUser: (userId: string) =>
    apiClient.get<ApiResponse<AdminUsageUserDetail>>(`/admin/usage/users/${userId}`),

  listPolicies: () =>
    apiClient.get<ApiResponse<UsagePolicy[]>>('/admin/usage/policies'),

  updatePolicy: (policyId: string, body: UsagePolicyUpdateInput) =>
    apiClient.put<ApiResponse<UsagePolicy>>(`/admin/usage/policies/${policyId}`, body),

  listHistory: (params?: { policyId?: string; page?: number; limit?: number }) =>
    apiClient.get<
      ApiResponse<{ total: number; items: UsagePolicyHistoryItem[] } | PaginatedResponse<UsagePolicyHistoryItem>>
    >('/admin/usage/policies/history', { params }),
};
