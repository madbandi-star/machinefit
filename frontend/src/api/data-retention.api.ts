import type {
  ApiResponse,
  DataRetentionRecord,
  DataRetentionSummary,
  DeletionExecutionLog,
  RetentionConsentCatalogItem,
  RetentionPolicy,
  RetentionPolicyCreateInput,
  RetentionPolicyUpdateInput,
  RetentionPolicyVersion,
  RetentionHoldInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const dataRetentionApi = {
  summary: () =>
    apiClient.get<ApiResponse<DataRetentionSummary>>('/admin/data-retention/summary'),

  listPolicies: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<ApiResponse<{ items: RetentionPolicy[]; total: number }>>(
      '/admin/data-retention/policies',
      { params }
    ),

  getPolicy: (id: string) =>
    apiClient.get<
      ApiResponse<{ policy: RetentionPolicy; versions: RetentionPolicyVersion[] }>
    >(`/admin/data-retention/policies/${id}`),

  createPolicy: (body: RetentionPolicyCreateInput) =>
    apiClient.post<ApiResponse<RetentionPolicy>>('/admin/data-retention/policies', body),

  updatePolicy: (id: string, body: RetentionPolicyUpdateInput) =>
    apiClient.patch<
      ApiResponse<
        | {
            requiresConfirmation: true;
            impact: {
              affectedRecords: number;
              scheduleChanged: number;
              sample: Array<{
                recordId: string;
                subjectId: string;
                before: string;
                after: string;
              }>;
            };
            message: string;
          }
        | {
            requiresConfirmation: false;
            policy: RetentionPolicy;
            rescheduledRecords: number;
          }
      >
    >(`/admin/data-retention/policies/${id}`, body),

  listScheduled: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<ApiResponse<{ items: DataRetentionRecord[]; total: number }>>(
      '/admin/data-retention/scheduled',
      { params }
    ),

  listDeletionLogs: (limit = 100) =>
    apiClient.get<ApiResponse<DeletionExecutionLog[]>>(
      '/admin/data-retention/deletion-logs',
      { params: { limit } }
    ),

  listConsents: () =>
    apiClient.get<ApiResponse<RetentionConsentCatalogItem[]>>(
      '/admin/data-retention/consents'
    ),

  setHold: (id: string, body: RetentionHoldInput) =>
    apiClient.post<ApiResponse<DataRetentionRecord>>(
      `/admin/data-retention/records/${id}/hold`,
      body
    ),

  syncWithdrawn: () =>
    apiClient.post<ApiResponse<{ upserted: number }>>(
      '/admin/data-retention/sync-withdrawn'
    ),
};
