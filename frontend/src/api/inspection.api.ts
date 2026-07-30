import type {
  CreateMachineFaultInput,
  CreateMachineInspectionInput,
  CreateMachinePartInput,
  CreateMachinePmScheduleInput,
  CreateMachineRepairInput,
  CreateMemberMachineReportInput,
  GymMachineOpsSummary,
  GymMachinePhoto,
  InspectionDashboardStats,
  InspectionTemplateItem,
  MachineFault,
  MachineInspection,
  MachinePart,
  MachinePmSchedule,
  MachineRepair,
  PaginatedResponse,
  ApiResponse,
  UpdateMachinePartInput,
} from '@machinefit/shared';
import { apiClient } from '@/services/http/axios-client';

const BASE = '/inspection';

export const inspectionApi = {
  listTemplates: (params?: { brandId?: string }) =>
    apiClient.get<ApiResponse<InspectionTemplateItem[]>>(`${BASE}/templates`, { params }),

  createTemplate: (input: {
    itemKey: string;
    itemName: Record<string, string>;
    brandId?: string | null;
    machineCategory?: string | null;
    displayOrder?: number;
    required?: boolean;
  }) => apiClient.post<ApiResponse<InspectionTemplateItem>>(`${BASE}/templates`, input),

  updateTemplate: (
    id: string,
    input: {
      itemName?: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
      active?: boolean;
      machineCategory?: string | null;
    }
  ) => apiClient.patch<ApiResponse<InspectionTemplateItem>>(`${BASE}/templates/${id}`, input),

  listGymMachines: (params: { gymId: string; opsStatus?: string; q?: string }) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary[]>>(`${BASE}/gym-machines`, { params }),

  getGymMachine: (id: string) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`${BASE}/gym-machines/${id}`),

  getGymMachinePublic: (id: string) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`${BASE}/gym-machines/${id}/public`),

  getGymMachineByCode: (params: { gymId: string; machineCode: string }) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`${BASE}/gym-machines/by-code`, { params }),

  createInspection: (input: CreateMachineInspectionInput) =>
    apiClient.post<ApiResponse<MachineInspection>>(`${BASE}/inspections`, input),

  listInspections: (params: {
    gymId: string;
    gymMachineId?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<MachineInspection>>>(`${BASE}/inspections`, {
      params,
    }),

  getInspection: (id: string) =>
    apiClient.get<ApiResponse<MachineInspection>>(`${BASE}/inspections/${id}`),

  listFaults: (gymId: string) =>
    apiClient.get<ApiResponse<MachineFault[]>>(`${BASE}/faults`, { params: { gymId } }),

  createFault: (input: CreateMachineFaultInput) =>
    apiClient.post<ApiResponse<MachineFault>>(`${BASE}/faults`, input),

  updateFault: (
    id: string,
    input: {
      status?: string;
      severity?: string;
      assigneeUserId?: string | null;
      suspectedCause?: string | null;
    }
  ) => apiClient.patch<ApiResponse<MachineFault>>(`${BASE}/faults/${id}`, input),

  listPm: (gymId: string) =>
    apiClient.get<ApiResponse<MachinePmSchedule[]>>(`${BASE}/pm`, { params: { gymId } }),

  createPm: (input: CreateMachinePmScheduleInput) =>
    apiClient.post<ApiResponse<MachinePmSchedule>>(`${BASE}/pm`, input),

  updatePm: (
    id: string,
    input: {
      cycleType?: string;
      status?: string;
      markCompleted?: boolean;
      nextDueAt?: string | null;
      usageLimitCount?: number | null;
      usageLimitVolume?: number | null;
    }
  ) => apiClient.patch<ApiResponse<MachinePmSchedule>>(`${BASE}/pm/${id}`, input),

  deletePm: (id: string) => apiClient.delete<ApiResponse<{ deleted: true }>>(`${BASE}/pm/${id}`),

  refreshPmDue: (gymId: string) =>
    apiClient.post<ApiResponse<MachinePmSchedule[]>>(`${BASE}/pm/refresh-due`, null, {
      params: { gymId },
    }),

  listRepairs: (gymId: string) =>
    apiClient.get<ApiResponse<MachineRepair[]>>(`${BASE}/repairs`, { params: { gymId } }),

  createRepair: (input: CreateMachineRepairInput) =>
    apiClient.post<ApiResponse<MachineRepair>>(`${BASE}/repairs`, input),

  listParts: (gymId: string) =>
    apiClient.get<ApiResponse<MachinePart[]>>(`${BASE}/parts`, { params: { gymId } }),

  createPart: (input: CreateMachinePartInput) =>
    apiClient.post<ApiResponse<MachinePart>>(`${BASE}/parts`, input),

  updatePart: (id: string, input: UpdateMachinePartInput) =>
    apiClient.patch<ApiResponse<MachinePart>>(`${BASE}/parts/${id}`, input),

  deletePart: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: true }>>(`${BASE}/parts/${id}`),

  uploadPhoto: (gymMachineId: string, file: File, imageType = 'CURRENT') => {
    const form = new FormData();
    form.append('file', file);
    form.append('imageType', imageType);
    return apiClient.post<ApiResponse<GymMachinePhoto>>(
      `${BASE}/gym-machines/${gymMachineId}/photos`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  listPhotos: (gymMachineId: string) =>
    apiClient.get<ApiResponse<GymMachinePhoto[]>>(`${BASE}/gym-machines/${gymMachineId}/photos`),

  createMemberReport: (input: CreateMemberMachineReportInput) =>
    apiClient.post<ApiResponse<unknown>>(`${BASE}/member-reports`, input),

  dashboard: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>(`${BASE}/dashboard`, {
      params: { gymId },
    }),

  statistics: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>(`${BASE}/statistics`, {
      params: { gymId },
    }),
};
