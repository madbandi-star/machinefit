import type {
  ApiResponse,
  TimerHistoryCreateInput,
  TimerHistoryDayResponse,
  TimerHistoryMonthResponse,
  TimerHistorySessionDetail,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const timerHistoryApi = {
  create: (body: TimerHistoryCreateInput) =>
    apiClient.post<ApiResponse<{ id: string; duplicate: boolean }>>('/timer-history', body),
  month: (year: number, month: number) =>
    apiClient.get<ApiResponse<TimerHistoryMonthResponse>>('/timer-history', {
      params: { year, month },
    }),
  date: (date: string) =>
    apiClient.get<ApiResponse<TimerHistoryDayResponse>>(
      `/timer-history/date/${encodeURIComponent(date)}`
    ),
  session: (sessionId: string) =>
    apiClient.get<ApiResponse<TimerHistorySessionDetail>>(
      `/timer-history/sessions/${encodeURIComponent(sessionId)}`
    ),
};
