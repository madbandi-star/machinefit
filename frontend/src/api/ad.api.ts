import { apiClient } from '@/services/http/axios-client';
import type {
  AdAdminStats,
  AdDecision,
  AdFeatureFlagRow,
  AdPlacement,
  AdPolicy,
  ApiResponse,
} from '@machinefit/shared';

export const adApi = {
  decide: (params: {
    placement: string;
    event?: string;
    sessionId?: string;
    eventCount?: number;
  }) =>
    apiClient.get<ApiResponse<AdDecision>>('/ads/decision', { params }),

  track: (body: {
    type: 'impression' | 'click' | 'reward_complete' | 'reward_fail';
    placement: string;
    event?: string;
    sessionId?: string;
    provider?: string;
    adType?: string;
  }) => apiClient.post<ApiResponse<{ ok: true }>>('/ads/events', body),

  claimReward: (body: { placement?: string; sessionId?: string; provider?: string }) =>
    apiClient.post<ApiResponse<{ granted: boolean; message: string }>>(
      '/ads/reward/claim',
      body
    ),

  listFlags: () => apiClient.get<ApiResponse<AdFeatureFlagRow[]>>('/ads/admin/flags'),
  setFlag: (flagKey: string, enabled: boolean) =>
    apiClient.patch<ApiResponse<AdFeatureFlagRow>>(`/ads/admin/flags/${encodeURIComponent(flagKey)}`, {
      enabled,
    }),

  listPlacements: () =>
    apiClient.get<ApiResponse<AdPlacement[]>>('/ads/admin/placements'),
  updatePlacement: (
    id: string,
    body: { enabled?: boolean; priority?: number; name?: string; description?: string }
  ) => apiClient.patch<ApiResponse<AdPlacement>>(`/ads/admin/placements/${id}`, body),

  listPolicies: (placementId?: string) =>
    apiClient.get<ApiResponse<AdPolicy[]>>('/ads/admin/policies', {
      params: placementId ? { placementId } : undefined,
    }),
  updatePolicy: (
    id: string,
    body: Record<string, boolean | number | null | undefined>
  ) => apiClient.patch<ApiResponse<AdPolicy>>(`/ads/admin/policies/${id}`, body),

  getStats: (range: 'today' | 'yesterday' | '7d' | '30d' = 'today') =>
    apiClient.get<ApiResponse<AdAdminStats>>('/ads/admin/stats', { params: { range } }),
};
