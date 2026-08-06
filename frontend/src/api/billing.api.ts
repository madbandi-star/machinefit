import type {
  ApiResponse,
  BillingPlan,
  CheckoutSessionResult,
  PaginatedResponse,
  PaymentHistoryItem,
  SubscriptionStatusView,
  UserSubscription,
  AdminSubscriptionRow,
  Coupon,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const billingApi = {
  listPlans: () => apiClient.get<ApiResponse<BillingPlan[]>>('/plans'),

  getSubscription: () =>
    apiClient.get<ApiResponse<UserSubscription | null>>('/subscription'),

  getStatus: () =>
    apiClient.get<ApiResponse<SubscriptionStatusView>>('/billing/status'),

  startTrial: (body?: { planCode?: string; trialDays?: number }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>('/subscription/trial', body ?? {}),

  createCheckout: (body?: {
    planCode?: string;
    successUrl?: string;
    cancelUrl?: string;
    couponCode?: string;
  }) =>
    apiClient.post<ApiResponse<CheckoutSessionResult>>('/billing/create-checkout', body ?? {}),

  cancel: (body?: { reason?: string }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>('/billing/cancel', body ?? {}),

  resume: () =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>('/billing/resume', {}),

  paymentHistory: (params?: { limit?: number }) =>
    apiClient.get<ApiResponse<PaymentHistoryItem[]>>('/billing/history', { params }),

  applyCoupon: (code: string) =>
    apiClient.post<ApiResponse<unknown>>('/billing/coupon', { code }),

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

  grantTrial: (userId: string, body?: { days?: number; planCode?: string }) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>(
      `/admin/subscriptions/${userId}/grant-trial`,
      body ?? {}
    ),

  refund: (
    userId: string,
    body: { paymentId?: string; providerPaymentId?: string; reason?: string }
  ) =>
    apiClient.post<ApiResponse<SubscriptionStatusView>>(
      `/admin/subscriptions/${userId}/refund`,
      body
    ),

  listCoupons: () => apiClient.get<ApiResponse<Coupon[]>>('/admin/coupons'),

  createCoupon: (body: {
    code: string;
    kind: string;
    value: number;
    maxRedemptions?: number | null;
    description?: string | null;
  }) => apiClient.post<ApiResponse<Coupon>>('/admin/coupons', body),

  deleteCoupon: (code: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/admin/coupons/${encodeURIComponent(code)}`),
};
