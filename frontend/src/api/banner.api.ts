import { apiClient } from '@/services/http/axios-client';
import type {
  ApiResponse,
  BannerAdminStats,
  BannerDetail,
  BannerListResponse,
  BannerSlot,
  BannerStatsRow,
  CreateBannerInput,
  CreateBannerSlotInput,
  PublicBanner,
  UpdateBannerInput,
  UpdateBannerSlotInput,
} from '@machinefit/shared';

export const bannerApi = {
  listPublic: (slotKey: string) =>
    apiClient.get<ApiResponse<{ banners: PublicBanner[] }>>(
      `/banners/public/${encodeURIComponent(slotKey)}`
    ),

  recordEvent: (body: {
    bannerId: string;
    slotKey: string;
    eventType: 'impression' | 'click';
    sessionId?: string;
  }) => apiClient.post(`/banners/public/events`, body),

  listAdmin: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<ApiResponse<BannerListResponse>>('/banners/admin', { params }),

  getAdmin: (id: string) =>
    apiClient.get<ApiResponse<BannerDetail>>(`/banners/admin/${id}`),

  create: (body: CreateBannerInput) =>
    apiClient.post<ApiResponse<BannerDetail>>('/banners/admin', body),

  update: (id: string, body: UpdateBannerInput) =>
    apiClient.put<ApiResponse<BannerDetail>>(`/banners/admin/${id}`, body),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/banners/admin/${id}`),

  uploadImage: (id: string, file: File, kind: 'desktop' | 'mobile' = 'desktop') => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<BannerDetail>>(
      `/banners/admin/${id}/image`,
      form,
      {
        params: { kind },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  clearImage: (id: string, kind: 'desktop' | 'mobile' = 'desktop') =>
    apiClient.delete<ApiResponse<BannerDetail>>(`/banners/admin/${id}/image`, {
      params: { kind },
    }),

  listSlots: () => apiClient.get<ApiResponse<BannerSlot[]>>('/banners/admin/slots'),

  createSlot: (body: CreateBannerSlotInput) =>
    apiClient.post<ApiResponse<BannerSlot>>('/banners/admin/slots', body),

  updateSlot: (id: string, body: UpdateBannerSlotInput) =>
    apiClient.put<ApiResponse<BannerSlot>>(`/banners/admin/slots/${id}`, body),

  stats: () => apiClient.get<ApiResponse<BannerAdminStats>>('/banners/admin/stats'),

  statsRows: () => apiClient.get<ApiResponse<BannerStatsRow[]>>('/banners/admin/stats/rows'),
};
