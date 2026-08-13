import type {
  ApiResponse,
  CreateQaArticleInput,
  QaAdminStats,
  QaArticleDetail,
  QaCategoryMeta,
  QaFeedbackValue,
  QaListResponse,
  UpdateQaArticleInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export interface QaListParams {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  popularLimit?: number;
  sort?: 'priority' | 'views' | 'helpful' | 'order' | 'updated';
  includeUnpublished?: boolean;
}

export const qaApi = {
  list: (params?: QaListParams) =>
    apiClient.get<ApiResponse<QaListResponse>>('/qa', { params }),

  categories: () => apiClient.get<ApiResponse<QaCategoryMeta[]>>('/qa/categories'),

  get: (id: string) => apiClient.get<ApiResponse<QaArticleDetail>>(`/qa/${id}`),

  feedback: (id: string, value: QaFeedbackValue) =>
    apiClient.post<ApiResponse<QaArticleDetail>>(`/qa/${id}/feedback`, { value }),
};

export const adminQaApi = {
  list: (params?: QaListParams) =>
    apiClient.get<ApiResponse<QaListResponse>>('/admin/qa', {
      params: { ...params, includeUnpublished: true },
    }),

  stats: () => apiClient.get<ApiResponse<QaAdminStats>>('/admin/qa/stats'),

  get: (id: string) => apiClient.get<ApiResponse<QaArticleDetail>>(`/admin/qa/${id}`),

  create: (body: CreateQaArticleInput) =>
    apiClient.post<ApiResponse<QaArticleDetail>>('/admin/qa', body),

  update: (id: string, body: UpdateQaArticleInput) =>
    apiClient.patch<ApiResponse<QaArticleDetail>>(`/admin/qa/${id}`, body),

  publish: (id: string, isPublished: boolean) =>
    apiClient.patch<ApiResponse<{ id: string; isPublished: boolean }>>(
      `/admin/qa/${id}/publish`,
      { isPublished }
    ),

  reorder: (items: { id: string; displayOrder: number }[]) =>
    apiClient.put<ApiResponse<{ updated: number }>>('/admin/qa/reorder', { items }),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/admin/qa/${id}`),
};
