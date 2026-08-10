import { apiClient, API_BASE_URL } from '@/services/http/axios-client';
import type {
  ApiResponse,
  BackupClientSettings,
  BackupFormat,
  BackupImportResult,
  BackupJobProgress,
  BackupLogItem,
  BackupRestoreMode,
  BackupSettings,
  BackupSettingsUpdateInput,
} from '@machinefit/shared';
import { useAuthStore } from '@/store/auth.store';

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().tokens?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function downloadBlob(
  path: string,
  init?: RequestInit
): Promise<{ blob: Blob; fileName: string; jobId: string | null }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let message = `Backup request failed (${res.status})`;
    try {
      const json = (await res.json()) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = /filename="([^"]+)"/i.exec(disposition);
  const fileName = match?.[1] || 'machinefit_backup.zip';
  const jobId = res.headers.get('X-Backup-Job-Id');
  const blob = await res.blob();
  return { blob, fileName, jobId };
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const backupApi = {
  exportUser: async (params?: {
    format?: BackupFormat;
    clientSettings?: BackupClientSettings;
    onProgress?: (pct: number) => void;
  }) => {
    params?.onProgress?.(12);
    const timer = window.setInterval(() => {
      params?.onProgress?.(Math.min(88, Math.round(Math.random() * 10 + 40)));
    }, 400);
    try {
      const { blob, fileName, jobId } = await downloadBlob('/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: params?.format ?? 'zip',
          clientSettings: params?.clientSettings ?? {},
        }),
      });
      params?.onProgress?.(100);
      triggerDownload(blob, fileName);
      return { fileName, jobId };
    } finally {
      window.clearInterval(timer);
    }
  },

  importUser: async (params: {
    file: File;
    mode: BackupRestoreMode;
    onProgress?: (pct: number) => void;
  }) => {
    params.onProgress?.(10);
    const form = new FormData();
    form.append('file', params.file);
    form.append('mode', params.mode);
    const timer = window.setInterval(() => {
      params.onProgress?.(Math.min(90, Math.round(Math.random() * 20 + 35)));
    }, 350);
    try {
      const res = await apiClient.post<
        ApiResponse<BackupImportResult & { jobId: string }>
      >('/backup/import', form, {
        // Let axios set multipart boundary; large restores need a longer timeout.
        timeout: 120_000,
      });
      params.onProgress?.(100);
      return res.data.data;
    } finally {
      window.clearInterval(timer);
    }
  },

  history: () =>
    apiClient.get<ApiResponse<{ items: BackupLogItem[] }>>('/backup/history'),

  job: (jobId: string) =>
    apiClient.get<ApiResponse<BackupJobProgress>>(`/backup/jobs/${jobId}`),

  downloadUser: async (jobId: string) => {
    const { blob, fileName } = await downloadBlob(`/backup/download/${jobId}`);
    triggerDownload(blob, fileName);
  },

  systemBackup: async (params?: {
    format?: BackupFormat;
    onProgress?: (pct: number) => void;
  }) => {
    params?.onProgress?.(10);
    const timer = window.setInterval(() => {
      params?.onProgress?.(Math.min(90, Math.round(Math.random() * 15 + 40)));
    }, 500);
    try {
      const { blob, fileName, jobId } = await downloadBlob('/admin/system-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: params?.format ?? 'zip' }),
      });
      params?.onProgress?.(100);
      triggerDownload(blob, fileName);
      return { fileName, jobId };
    } finally {
      window.clearInterval(timer);
    }
  },

  systemRestore: async (params: {
    file: File;
    confirmText: string;
    onProgress?: (pct: number) => void;
  }) => {
    params.onProgress?.(8);
    const form = new FormData();
    form.append('file', params.file);
    form.append('confirmText', params.confirmText);
    const timer = window.setInterval(() => {
      params.onProgress?.(Math.min(92, Math.round(Math.random() * 20 + 30)));
    }, 500);
    try {
      const res = await apiClient.post<
        ApiResponse<{ jobId: string; restoredTables: string[] }>
      >('/admin/system-restore', form, {
        timeout: 120_000,
      });
      params.onProgress?.(100);
      return res.data.data;
    } finally {
      window.clearInterval(timer);
    }
  },

  systemHistory: () =>
    apiClient.get<ApiResponse<{ items: BackupLogItem[] }>>('/admin/system-backup/history'),

  getSettings: () =>
    apiClient.get<ApiResponse<BackupSettings>>('/admin/backup-settings'),

  updateSettings: (body: BackupSettingsUpdateInput) =>
    apiClient.put<ApiResponse<BackupSettings>>('/admin/backup-settings', body),
};
