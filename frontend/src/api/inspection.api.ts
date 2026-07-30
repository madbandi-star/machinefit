import type {
  CreateMachineFaultInput,
  CreateMachineInspectionInput,
  CreateMemberMachineReportInput,
  GymMachineOpsSummary,
  InspectionDashboardStats,
  InspectionTemplateItem,
  MachineFault,
  MachineInspection,
  PaginatedResponse,
  ApiResponse,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

export const inspectionApi = {
  listTemplates: (params?: { brandId?: string }) =>
    apiClient.get<ApiResponse<InspectionTemplateItem[]>>('/templates', { params }),

  listGymMachines: (params: { gymId: string; opsStatus?: string; q?: string }) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary[]>>('/gym-machines', { params }),

  getGymMachine: (id: string) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`/gym-machines/${id}`),

  getGymMachineByCode: (params: { gymId: string; machineCode: string }) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>('/gym-machines/by-code', { params }),

  createInspection: (input: CreateMachineInspectionInput) =>
    apiClient.post<ApiResponse<MachineInspection>>('/inspections', input),

  listInspections: (params: {
    gymId: string;
    gymMachineId?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<ApiResponse<PaginatedResponse<MachineInspection>>>('/inspections', { params }),

  getInspection: (id: string) =>
    apiClient.get<ApiResponse<MachineInspection>>(`/inspections/${id}`),

  listFaults: (gymId: string) =>
    apiClient.get<ApiResponse<MachineFault[]>>('/faults', { params: { gymId } }),

  createFault: (input: CreateMachineFaultInput) =>
    apiClient.post<ApiResponse<MachineFault>>('/faults', input),

  updateFault: (
    id: string,
    input: {
      status?: string;
      severity?: string;
      assigneeUserId?: string | null;
      suspectedCause?: string | null;
    }
  ) => apiClient.patch<ApiResponse<MachineFault>>(`/faults/${id}`, input),

  createMemberReport: (input: CreateMemberMachineReportInput) =>
    apiClient.post<ApiResponse<unknown>>('/member-reports', input),

  dashboard: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>('/dashboard', { params: { gymId } }),

  statistics: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>('/statistics', { params: { gymId } }),
};
