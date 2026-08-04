import type {
  ApiResponse,
  OpsAlertRow,
  OpsApiRouteStat,
  OpsAuditRow,
  OpsDashboardSnapshot,
  OpsDbQueryRow,
  OpsErrorGroupRow,
  OpsFeatureStat,
  OpsHealthSnapshot,
  OpsLogRow,
  OpsPageStat,
  OpsRange,
  OpsSecurityRow,
} from '@machinefit/shared';
import { apiClient, API_BASE_URL } from '@/services/http/axios-client';
import { useAuthStore } from '@/store/auth.store';

export type OpsReport = {
  period: 'daily' | 'weekly' | 'monthly';
  generatedAt: string;
  newMembers: number;
  activeMembers: number;
  topFeatures: OpsFeatureStat[];
  topPages: OpsPageStat[];
  apiAvgMs: number | null;
  errorCount: number;
  uptimeSec: number;
  premiumConversionRate: number | null;
};

export const opsApi = {
  health: () => apiClient.get<ApiResponse<OpsHealthSnapshot>>('/ops/health'),

  dashboard: (range: OpsRange = '30d') =>
    apiClient.get<ApiResponse<OpsDashboardSnapshot>>('/ops/admin/dashboard', {
      params: { range },
    }),

  errors: (params?: { unresolvedOnly?: boolean }) =>
    apiClient.get<ApiResponse<OpsErrorGroupRow[]>>('/ops/admin/errors', { params }),

  resolveError: (id: string) =>
    apiClient.post<ApiResponse<{ ok: boolean }>>(
      `/ops/admin/errors/${encodeURIComponent(id)}/resolve`
    ),

  apiStats: (range: OpsRange = 'today') =>
    apiClient.get<ApiResponse<OpsApiRouteStat[]>>('/ops/admin/api-stats', {
      params: { range },
    }),

  pages: (range: OpsRange = '30d') =>
    apiClient.get<ApiResponse<OpsPageStat[]>>('/ops/admin/pages', { params: { range } }),

  features: (range: OpsRange = '30d') =>
    apiClient.get<ApiResponse<OpsFeatureStat[]>>('/ops/admin/features', {
      params: { range },
    }),

  logs: (params?: {
    kind?: string;
    q?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => apiClient.get<ApiResponse<OpsLogRow[]>>('/ops/admin/logs', { params }),

  security: (limit = 50) =>
    apiClient.get<ApiResponse<OpsSecurityRow[]>>('/ops/admin/security', {
      params: { limit },
    }),

  audits: (limit = 50) =>
    apiClient.get<ApiResponse<OpsAuditRow[]>>('/ops/admin/audits', { params: { limit } }),

  alerts: () => apiClient.get<ApiResponse<OpsAlertRow[]>>('/ops/admin/alerts'),

  ackAlert: (id: string) =>
    apiClient.post<ApiResponse<{ ok: boolean }>>(
      `/ops/admin/alerts/${encodeURIComponent(id)}/ack`
    ),

  slowQueries: () =>
    apiClient.get<ApiResponse<OpsDbQueryRow[]>>('/ops/admin/db/slow-queries'),

  report: (period: 'daily' | 'weekly' | 'monthly') =>
    apiClient.get<ApiResponse<OpsReport>>('/ops/admin/reports', { params: { period } }),

  /** Download CSV via authenticated fetch (blob). */
  async downloadLogsCsv(params?: {
    kind?: string;
    q?: string;
    from?: string;
    to?: string;
  }): Promise<void> {
    const token = useAuthStore.getState().tokens?.accessToken;
    const qs = new URLSearchParams();
    if (params?.kind) qs.set('kind', params.kind);
    if (params?.q) qs.set('q', params.q);
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const res = await fetch(`${API_BASE_URL}/ops/admin/logs/export.csv?${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('CSV export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ops-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  async downloadReportCsv(period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const token = useAuthStore.getState().tokens?.accessToken;
    const res = await fetch(
      `${API_BASE_URL}/ops/admin/reports?period=${period}&format=csv`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) throw new Error('Report CSV export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ops-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
