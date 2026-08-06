import { apiClient } from '@/services/http/axios-client';
import type {
  ApiResponse,
  ApplyWorkoutCardTemplateInput,
  CopyWorkoutCardInput,
  CreateWorkoutCardInput,
  CreateWorkoutCardTemplateInput,
  MoveWorkoutCardDateInput,
  PatchWorkoutCardStatusInput,
  ResolveMissedWorkoutCardInput,
  UpdateWorkoutCardInput,
  WorkoutCard,
  WorkoutCardDaySummary,
  WorkoutCardListQuery,
  WorkoutCardStatus,
  WorkoutCardTemplate,
  WorkoutPlanStats,
} from '@machinefit/shared';

export type WorkoutCardListParams = WorkoutCardListQuery & {
  status?: WorkoutCardStatus | WorkoutCardStatus[];
};

export const workoutCardApi = {
  list: (params: WorkoutCardListParams) =>
    apiClient.get<ApiResponse<WorkoutCard[]>>('/workout-cards', { params }),

  create: (body: CreateWorkoutCardInput) =>
    apiClient.post<ApiResponse<WorkoutCard>>('/workout-cards', body),

  update: (id: string, body: UpdateWorkoutCardInput) =>
    apiClient.patch<ApiResponse<WorkoutCard>>(`/workout-cards/${id}`, body),

  patchStatus: (id: string, body: PatchWorkoutCardStatusInput) =>
    apiClient.patch<ApiResponse<WorkoutCard>>(`/workout-cards/${id}/status`, body),

  moveDate: (id: string, body: MoveWorkoutCardDateInput) =>
    apiClient.patch<ApiResponse<WorkoutCard>>(`/workout-cards/${id}/move-date`, body),

  copy: (id: string, body: CopyWorkoutCardInput) =>
    apiClient.post<ApiResponse<WorkoutCard>>(`/workout-cards/${id}/copy`, body),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/workout-cards/${id}`),

  listMissed: (params: { gymId: string; memberId: string }) =>
    apiClient.get<ApiResponse<WorkoutCard[]>>('/workout-cards/missed', { params }),

  resolveMissed: (id: string, body: ResolveMissedWorkoutCardInput) =>
    apiClient.post<ApiResponse<WorkoutCard | null>>(
      `/workout-cards/${id}/resolve-missed`,
      body
    ),

  stats: (params: { gymId: string; memberId: string; from?: string; to?: string }) =>
    apiClient.get<ApiResponse<WorkoutPlanStats>>('/workout-cards/stats', { params }),

  calendarSummary: (params: {
    gymId: string;
    memberId: string;
    from: string;
    to: string;
  }) =>
    apiClient.get<ApiResponse<WorkoutCardDaySummary[]>>('/workout-cards/calendar-summary', {
      params,
    }),

  listTemplates: (params?: { gymId?: string }) =>
    apiClient.get<ApiResponse<WorkoutCardTemplate[]>>('/workout-cards/templates', {
      params,
    }),

  createTemplate: (body: CreateWorkoutCardTemplateInput) =>
    apiClient.post<ApiResponse<WorkoutCardTemplate>>('/workout-cards/templates', body),

  applyTemplate: (body: ApplyWorkoutCardTemplateInput) =>
    apiClient.post<ApiResponse<WorkoutCard[]>>('/workout-cards/templates/apply', body),

  deleteTemplate: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/workout-cards/templates/${id}`),
};
