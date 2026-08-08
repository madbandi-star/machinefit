import type {
  ApiResponse,
  FortuneContentCreateInput,
  FortuneContentItem,
  FortuneContentUpdateInput,
  TodayFortuneResponse,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const fortuneApi = {
  getToday: (params?: { gymId?: string; memberId?: string; date?: string; locale?: string }) =>
    apiClient.get<ApiResponse<TodayFortuneResponse>>('/fortune/today', { params }),
};

export const adminFortuneApi = {
  list: (params?: { locale?: string; category?: string; includeInactive?: boolean }) =>
    apiClient.get<ApiResponse<FortuneContentItem[]>>('/admin/fortune-content', {
      params: {
        ...params,
        includeInactive: params?.includeInactive ? 'true' : undefined,
      },
    }),
  create: (data: FortuneContentCreateInput) =>
    apiClient.post<ApiResponse<FortuneContentItem>>('/admin/fortune-content', data),
  update: (id: string, data: FortuneContentUpdateInput) =>
    apiClient.patch<ApiResponse<FortuneContentItem>>(`/admin/fortune-content/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ id: string }>>(`/admin/fortune-content/${id}`),
};
