import type {
  ApiResponse,
  AdminAuditLog,
  ComplianceOverview,
  ConsentUpdateInput,
  CreateSupportTicketInput,
  LegalDocument,
  PrivacyDataSummary,
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
        locationOptIn: boolean;
        pushServiceOptIn: boolean;
      }>
    >('/privacy/me/consents', input),

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
