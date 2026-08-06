import { apiClient } from '@/services/http/axios-client';
import type {
  ApiResponse,
  CreateNoticeInput,
  NoticeAdminStats,
  NoticeAttachment,
  NoticeDetail,
  NoticeListItem,
  NoticeListResponse,
  UpdateNoticeInput,
} from '@machinefit/shared';

export const noticeApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    apiClient.get<ApiResponse<NoticeListResponse>>('/notices', { params }),

  get: (id: string, params?: { language?: string; admin?: boolean }) =>
    apiClient.get<ApiResponse<NoticeDetail>>(`/notices/${id}`, {
      params: {
        ...params,
        ...(params?.admin ? { admin: 'true' } : {}),
      },
    }),

  banner: (language?: string) =>
    apiClient.get<ApiResponse<NoticeListItem | null>>('/notices/banner', {
      params: language ? { language } : undefined,
    }),

  popup: (language?: string) =>
    apiClient.get<ApiResponse<NoticeListItem | null>>('/notices/popup', {
      params: language ? { language } : undefined,
    }),

  stats: () => apiClient.get<ApiResponse<NoticeAdminStats>>('/notices/stats'),

  create: (body: CreateNoticeInput) =>
    apiClient.post<ApiResponse<NoticeDetail>>('/notices', body),

  update: (id: string, body: UpdateNoticeInput) =>
    apiClient.put<ApiResponse<NoticeDetail>>(`/notices/${id}`, body),

  remove: (id: string) => apiClient.delete<ApiResponse<{ message: string }>>(`/notices/${id}`),

  publish: (id: string, body: { status?: string; publishAt?: string | null } = {}) =>
    apiClient.patch<ApiResponse<NoticeDetail>>(`/notices/${id}/publish`, body),

  pin: (id: string, value: boolean) =>
    apiClient.patch<ApiResponse<NoticeDetail>>(`/notices/${id}/pin`, { value }),

  important: (id: string, value: boolean) =>
    apiClient.patch<ApiResponse<NoticeDetail>>(`/notices/${id}/important`, { value }),

  bannerFlag: (id: string, value: boolean) =>
    apiClient.patch<ApiResponse<NoticeDetail>>(`/notices/${id}/banner`, { value }),

  popupFlag: (id: string, value: boolean) =>
    apiClient.patch<ApiResponse<NoticeDetail>>(`/notices/${id}/popup`, { value }),

  uploadAttachment: (id: string, file: File, isInlineImage = false) => {
    const form = new FormData();
    form.append('file', file);
    if (isInlineImage) form.append('isInlineImage', 'true');
    return apiClient.post<ApiResponse<NoticeAttachment>>(`/notices/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAttachment: (id: string, attachmentId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(
      `/notices/${id}/attachments/${attachmentId}`
    ),

  downloadUrl: (id: string, attachmentId: string) =>
    `/notices/${id}/attachments/${attachmentId}/download`,
};
