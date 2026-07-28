import type { ApiResponse, TrainerApplication, TrainerApplicationInput } from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export interface TrainerApplyResult {
  approved: boolean;
  pending?: boolean;
  message: string;
  application?: TrainerApplication | null;
  user: { roleCode: string } | null;
}

export const trainerApi = {
  apply: (input: TrainerApplicationInput) =>
    apiClient.post<ApiResponse<TrainerApplyResult>>('/trainer/apply', input),
};
