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
    apiClient.post<ApiResponse<PushSendResult>>('/push/send', input),

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
