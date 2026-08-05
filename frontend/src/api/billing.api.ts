import type {
  ApiResponse,
  BillingPlan,
  PaginatedResponse,
  PaymentHistoryItem,
  SubscriptionStatusView,
  UserSubscription,
  AdminSubscriptionRow,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const billingApi = {
  listPlans: () => apiClient.get<ApiResponse<BillingPlan[]>>('/plans'),

  getSubscription: () =>
    apiClient.get<ApiResponse<UserSubscription | null>>('/subscription'),

  getStatus: () =>
    apiClient.get<ApiResponse<SubscriptionStatusView>>('/subscription/status'),

  startTrial: (body?: { planCode?: string; trialDays?: number }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>('/subscription/trial', body ?? {}),

  cancel: (body?: { reason?: string }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>('/subscription/cancel', body ?? {}),

  paymentHistory: (params?: { limit?: number }) =>
    apiClient.get<ApiResponse<PaymentHistoryItem[]>>('/payment/history', { params }),

  paymentProviders: () =>
    apiClient.get<
      ApiResponse<{
        active: string;
        providers: Array<{ id: string; available: boolean; label: string }>;
        checkoutEnabled: boolean;
        note: string;
      }>
    >('/payment/providers'),
};

export const adminBillingApi = {
  list: (params?: { q?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<PaginatedResponse<AdminSubscriptionRow>>>('/admin/subscriptions', {
      params,
    }),

  getUser: (userId: string) =>
    apiClient.get<ApiResponse<SubscriptionStatusView>>(`/admin/subscriptions/${userId}`),

  extend: (userId: string, body: { days: number; planCode?: string }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>(
      `/admin/subscriptions/${userId}/extend`,
      body
    ),

  end: (userId: string) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>(
      `/admin/subscriptions/${userId}/end`
    ),

  set: (
    userId: string,
    body: { planCode: string; status: string; days?: number }
  ) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>(
      `/admin/subscriptions/${userId}/set`,
      body
    ),
};
