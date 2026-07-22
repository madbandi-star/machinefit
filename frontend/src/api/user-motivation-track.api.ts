import type {
  ApiResponse,
  CreateMotivationTrackFromUrlInput,
  MotivationAudioLimits,
  UpdateMotivationTrackInput,
  UserMotivationTrack,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export type MotivationTrackListResponse = {
  items: UserMotivationTrack[];
  limits: MotivationAudioLimits;
};

export type MotivationUploadProgress = {
  percent: number;
  loaded: number;
  total: number;
  remainingSeconds: number | null;
};

export const userMotivationTrackApi = {
  list: () =>
    apiClient.get<ApiResponse<MotivationTrackListResponse>>('/users/me/motivation-tracks'),

  createFromUrl: (body: CreateMotivationTrackFromUrlInput) =>
    apiClient.post<ApiResponse<UserMotivationTrack>>('/users/me/motivation-tracks/url', body),

  upload: (
    file: File,
    options: {
      title?: string;
      durationSeconds?: number | null;
      setAsDefault?: boolean;
      onProgress?: (progress: MotivationUploadProgress) => void;
    } = {}
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (options.title?.trim()) form.append('title', options.title.trim());
    if (options.durationSeconds != null) {
      form.append('durationSeconds', String(options.durationSeconds));
    }
    if (options.setAsDefault) form.append('setAsDefault', 'true');

    const startedAt = Date.now();

    return apiClient.post<ApiResponse<UserMotivationTrack>>(
      '/users/me/motivation-tracks/upload',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
        onUploadProgress: (event) => {
          if (!options.onProgress || !event.total) return;
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          const elapsedMs = Math.max(1, Date.now() - startedAt);
          const bytesPerMs = event.loaded / elapsedMs;
          const remainingBytes = Math.max(0, event.total - event.loaded);
          const remainingSeconds =
            bytesPerMs > 0 ? Math.ceil(remainingBytes / bytesPerMs / 1000) : null;
          options.onProgress({
            percent,
            loaded: event.loaded,
            total: event.total,
            remainingSeconds,
          });
        },
      }
    );
  },

  update: (id: string, body: UpdateMotivationTrackInput) =>
    apiClient.patch<ApiResponse<UserMotivationTrack>>(`/users/me/motivation-tracks/${id}`, body),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/users/me/motivation-tracks/${id}`),
};
