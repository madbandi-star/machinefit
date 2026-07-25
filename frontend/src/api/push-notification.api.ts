import type {
  ApiResponse,
  PushCampaign,
  PushComposeCapabilities,
  PushDeliveryLog,
  PushSendInput,
  PushSendResult,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const pushNotificationApi = {
  capabilities: () =>
    apiClient.get<ApiResponse<PushComposeCapabilities>>('/push/capabilities'),

  send: (input: PushSendInput) =>
    // Large audiences (all_users / role) can exceed the default 15s axios timeout
    // even after server batching — keep a generous client budget.
    apiClient.post<ApiResponse<PushSendResult>>('/push/send', input, {
      timeout: 120_000,
    }),

  listCampaigns: (params?: { all?: boolean; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<PushCampaign[]>>('/push/campaigns', {
      params: {
        all: params?.all ? '1' : undefined,
        limit: params?.limit,
        offset: params?.offset,
      },
    }),

  listCampaignLogs: (campaignId: string) =>
    apiClient.get<ApiResponse<PushDeliveryLog[]>>(`/push/campaigns/${campaignId}/logs`),
};
