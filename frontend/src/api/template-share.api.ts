import { apiClient } from '@/services/http/axios-client';
import type {
  ApiResponse,
  PublishTemplateShareInput,
  TemplateShareAdminStats,
  TemplateShareComment,
  TemplateShareCommentBody,
  TemplateShareDetail,
  TemplateShareDownloadResult,
  TemplateShareListResponse,
  TemplateShareReport,
  TemplateShareReportBody,
  UpdateTemplateShareInput,
} from '@machinefit/shared';

export const templateShareApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<ApiResponse<TemplateShareListResponse>>('/template-shares', { params }),

  get: (id: string) =>
    apiClient.get<ApiResponse<TemplateShareDetail>>(`/template-shares/${id}`),

  publish: (body: PublishTemplateShareInput) =>
    apiClient.post<ApiResponse<TemplateShareDetail>>('/template-shares/publish', body),

  update: (id: string, body: UpdateTemplateShareInput) =>
    apiClient.patch<ApiResponse<TemplateShareDetail>>(`/template-shares/${id}`, body),

  download: (id: string) =>
    apiClient.post<ApiResponse<TemplateShareDownloadResult>>(
      `/template-shares/${id}/download`
    ),

  toggleLike: (id: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/template-shares/${id}/like`
    ),

  toggleFavorite: (id: string) =>
    apiClient.post<ApiResponse<{ favorited: boolean; favoriteCount: number }>>(
      `/template-shares/${id}/favorite`
    ),

  listComments: (id: string) =>
    apiClient.get<ApiResponse<TemplateShareComment[]>>(`/template-shares/${id}/comments`),

  addComment: (id: string, body: TemplateShareCommentBody) =>
    apiClient.post<ApiResponse<TemplateShareComment>>(`/template-shares/${id}/comments`, body),

  updateComment: (id: string, commentId: string, body: TemplateShareCommentBody) =>
    apiClient.patch<ApiResponse<TemplateShareComment>>(
      `/template-shares/${id}/comments/${commentId}`,
      body
    ),

  deleteComment: (id: string, commentId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(
      `/template-shares/${id}/comments/${commentId}`
    ),

  report: (id: string, body: TemplateShareReportBody) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/template-shares/${id}/report`, body),

  adminStats: () =>
    apiClient.get<ApiResponse<TemplateShareAdminStats>>('/template-shares/admin/stats'),

  adminList: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<ApiResponse<TemplateShareListResponse>>('/template-shares/admin', {
      params,
    }),

  adminSetStatus: (id: string, status: 'published' | 'hidden' | 'removed') =>
    apiClient.patch<ApiResponse<TemplateShareDetail>>(
      `/template-shares/admin/${id}/status`,
      { status }
    ),

  adminReports: () =>
    apiClient.get<ApiResponse<TemplateShareReport[]>>('/template-shares/admin/reports'),

  adminResolveReport: (
    reportId: string,
    status: 'open' | 'reviewed' | 'actioned' | 'dismissed'
  ) =>
    apiClient.patch<ApiResponse<TemplateShareReport>>(
      `/template-shares/admin/reports/${reportId}`,
      { status }
    ),
};
