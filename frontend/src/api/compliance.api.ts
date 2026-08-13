import type {
  ApiResponse,
  AdminAuditLog,
  AdminPrivacyRightsUpdateInput,
  ComplianceOverview,
  ConsentUpdateInput,
  CreatePrivacyRightsRequestInput,
  CreateSupportTicketInput,
  LegalDocument,
  PrivacyDataSummary,
  PrivacyProcessingPurposes,
  PrivacyRightsRequest,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketMessage,
  UserConsentRecord,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const complianceApi = {
  listLegalDocuments: (params?: { regionCode?: string; docType?: string }) =>
    apiClient.get<ApiResponse<LegalDocument[]>>('/legal/documents', { params }),

  getPrivacySummary: () =>
    apiClient.get<ApiResponse<PrivacyDataSummary>>('/privacy/me'),

  exportPrivacy: () =>
    apiClient.get<ApiResponse<Record<string, unknown>>>('/privacy/me/export'),

  listConsents: () =>
    apiClient.get<ApiResponse<UserConsentRecord[]>>('/privacy/me/consents'),

  updateConsents: (input: ConsentUpdateInput) =>
    apiClient.patch<
      ApiResponse<{
        marketingOptIn: boolean;
        eventOptIn: boolean;
        locationOptIn: boolean;
        pushServiceOptIn: boolean;
      }>
    >('/privacy/me/consents', input),

  getProcessingPurposes: () =>
    apiClient.get<ApiResponse<PrivacyProcessingPurposes>>(
      '/privacy/me/processing-purposes'
    ),

  listRightsRequests: () =>
    apiClient.get<ApiResponse<PrivacyRightsRequest[]>>('/privacy/me/rights-requests'),

  createRightsRequest: (input: CreatePrivacyRightsRequestInput) =>
    apiClient.post<ApiResponse<PrivacyRightsRequest>>(
      '/privacy/me/rights-requests',
      input
    ),

  cancelRightsRequest: (requestId: string) =>
    apiClient.post<ApiResponse<PrivacyRightsRequest>>(
      `/privacy/me/rights-requests/${requestId}/cancel`
    ),

  adminListRightsRequests: (params?: { status?: string; requestType?: string }) =>
    apiClient.get<ApiResponse<PrivacyRightsRequest[]>>(
      '/admin/privacy-rights/requests',
      { params }
    ),

  adminUpdateRightsRequest: (
    requestId: string,
    body: AdminPrivacyRightsUpdateInput
  ) =>
    apiClient.patch<ApiResponse<PrivacyRightsRequest>>(
      `/admin/privacy-rights/requests/${requestId}`,
      body
    ),

  adminBulkUpdateRightsRequests: (body: {
    ids: string[];
    status: AdminPrivacyRightsUpdateInput['status'];
    resultMessage?: string;
    rejectionReason?: string;
    applyProcessingStop?: boolean;
    applyCorrection?: boolean;
    noteLegalRetention?: boolean;
  }) =>
    apiClient.patch<
      ApiResponse<{
        updated: PrivacyRightsRequest[];
        missing: string[];
        count: number;
      }>
    >('/admin/privacy-rights/requests/bulk', body),

  adminDeleteRightsRequests: (ids: string[]) =>
    apiClient.delete<ApiResponse<{ deleted: number }>>(
      '/admin/privacy-rights/requests',
      { data: { ids } }
    ),

  createTicket: (input: CreateSupportTicketInput) =>
    apiClient.post<ApiResponse<SupportTicketDetail>>('/support/tickets', input),

  listTickets: () => apiClient.get<ApiResponse<SupportTicket[]>>('/support/tickets'),

  getTicket: (ticketId: string) =>
    apiClient.get<ApiResponse<SupportTicketDetail>>(`/support/tickets/${ticketId}`),

  addTicketMessage: (ticketId: string, body: string) =>
    apiClient.post<ApiResponse<SupportTicketMessage>>(
      `/support/tickets/${ticketId}/messages`,
      { body }
    ),

  adminOverview: () =>
    apiClient.get<ApiResponse<ComplianceOverview>>('/admin/compliance/overview'),

  adminConsents: (userId?: string) =>
    apiClient.get<ApiResponse<unknown[]>>('/admin/compliance/consents', {
      params: userId ? { userId } : undefined,
    }),

  adminUpsertDocument: (body: Record<string, unknown>) =>
    apiClient.post<ApiResponse<LegalDocument>>('/admin/compliance/documents', body),

  adminListTickets: (status?: string) =>
    apiClient.get<ApiResponse<SupportTicket[]>>('/admin/support/tickets', {
      params: status ? { status } : undefined,
    }),

  adminUpdateTicket: (
    ticketId: string,
    body: { status?: string; reply?: string; priority?: string }
  ) =>
    apiClient.patch<ApiResponse<SupportTicket>>(`/admin/support/tickets/${ticketId}`, body),

  adminAuditLogs: (limit = 100) =>
    apiClient.get<ApiResponse<AdminAuditLog[]>>('/admin/audit-logs', {
      params: { limit },
    }),
};
