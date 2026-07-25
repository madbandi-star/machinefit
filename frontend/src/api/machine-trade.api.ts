import type {
  ApiResponse,
  CreateMachineTradeInput,
  CreateTradeReportInput,
  ListMachineTradesInput,
  MachineTradeDetail,
  MachineTradeListItem,
  MachineTradeReport,
  MachineTradeStats,
  PaginatedResponse,
  ResolveTradeReportInput,
  TradeStatus,
  UpdateMachineTradeInput,
} from '@machinefit/shared';
import { apiClient, API_BASE_URL } from '@/services/http/axios-client';

export type MachineTradeListParams = Partial<ListMachineTradesInput>;

export interface CreateMachineTradeFormInput extends Omit<CreateMachineTradeInput, 'quantity' | 'description'> {
  quantity?: number;
  description?: string;
  files?: File[];
}

export const machineTradeApi = {
  list: (params?: MachineTradeListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineTradeListItem>>>('/machine-trades', {
      params,
    }),

  get: (tradeId: string) =>
    apiClient.get<ApiResponse<MachineTradeDetail>>(`/machine-trades/${tradeId}`),

  create: (input: CreateMachineTradeFormInput) => {
    const form = new FormData();
    form.append('tradeType', input.tradeType);
    form.append('machineId', input.machineId);
    form.append('price', String(input.price));
    if (input.condition != null) form.append('condition', input.condition);
    form.append('quantity', String(input.quantity ?? 1));
    form.append('regionLabel', input.regionLabel);
    if (input.countryCode != null) form.append('countryCode', input.countryCode);
    if (input.stateId != null) form.append('stateId', input.stateId);
    if (input.cityId != null) form.append('cityId', input.cityId);
    if (input.districtId != null) form.append('districtId', input.districtId);
    form.append('description', input.description ?? '');
    for (const file of input.files ?? []) {
      form.append('images', file);
    }
    return apiClient.post<ApiResponse<MachineTradeDetail>>('/machine-trades', form, {
      headers: { 'Content-Type': undefined },
      timeout: 120_000,
    });
  },

  update: (tradeId: string, input: UpdateMachineTradeInput) =>
    apiClient.patch<ApiResponse<MachineTradeDetail>>(`/machine-trades/${tradeId}`, input),

  remove: (tradeId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/machine-trades/${tradeId}`),

  republish: (tradeId: string) =>
    apiClient.post<ApiResponse<MachineTradeDetail>>(`/machine-trades/${tradeId}/republish`),

  toggleLike: (tradeId: string) =>
    apiClient.post<ApiResponse<{ liked: boolean; likeCount: number }>>(
      `/machine-trades/${tradeId}/like`
    ),

  report: (tradeId: string, input: CreateTradeReportInput) =>
    apiClient.post<ApiResponse<MachineTradeReport>>(`/machine-trades/${tradeId}/report`, input),

  /** Reports filed against the current owner's listings (read-only; admins resolve). */
  myReports: () =>
    apiClient.get<ApiResponse<MachineTradeReport[]>>('/machine-trades/my-reports'),

  getImageUrl: (imageId: string, variant: 'full' | 'thumb' = 'thumb') =>
    `${API_BASE_URL}/machine-trades/images/${encodeURIComponent(imageId)}?variant=${variant}`,

  adminList: (params?: MachineTradeListParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineTradeListItem>>>('/machine-trades/admin', {
      params,
    }),

  adminReports: () =>
    apiClient.get<ApiResponse<MachineTradeReport[]>>('/machine-trades/admin/reports'),

  adminResolveReport: (reportId: string, input: ResolveTradeReportInput) =>
    apiClient.patch<ApiResponse<MachineTradeReport>>(
      `/machine-trades/admin/reports/${reportId}`,
      input
    ),

  adminRestore: (tradeId: string) =>
    apiClient.post<ApiResponse<MachineTradeDetail>>(`/machine-trades/admin/${tradeId}/restore`),

  adminStats: () =>
    apiClient.get<ApiResponse<MachineTradeStats>>('/machine-trades/admin/stats'),

  /** Convenience: update status only. */
  updateStatus: (tradeId: string, status: TradeStatus) =>
    apiClient.patch<ApiResponse<MachineTradeDetail>>(`/machine-trades/${tradeId}`, { status }),
};
