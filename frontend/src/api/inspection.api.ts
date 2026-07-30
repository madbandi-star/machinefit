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

export const inspectionApi = {
  listTemplates: (params?: { brandId?: string }) =>
    apiClient.get<ApiResponse<InspectionTemplateItem[]>>('/templates', { params }),

  createTemplate: (input: {
    itemKey: string;
    itemName: Record<string, string>;
    brandId?: string | null;
    machineCategory?: string | null;
    displayOrder?: number;
    required?: boolean;
  }) => apiClient.post<ApiResponse<InspectionTemplateItem>>('/templates', input),

  updateTemplate: (
    id: string,
    input: {
      itemName?: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
      active?: boolean;
      machineCategory?: string | null;
    }
  ) => apiClient.patch<ApiResponse<InspectionTemplateItem>>(`/templates/${id}`, input),

  listGymMachines: (params: { gymId: string; opsStatus?: string; q?: string }) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary[]>>('/gym-machines', { params }),

  getGymMachine: (id: string) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`/gym-machines/${id}`),

  getGymMachinePublic: (id: string) =>
    apiClient.get<ApiResponse<GymMachineOpsSummary>>(`/gym-machines/${id}/public`),

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

  listPm: (gymId: string) =>
    apiClient.get<ApiResponse<MachinePmSchedule[]>>('/pm', { params: { gymId } }),

  createPm: (input: CreateMachinePmScheduleInput) =>
    apiClient.post<ApiResponse<MachinePmSchedule>>('/pm', input),

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
  ) => apiClient.patch<ApiResponse<MachinePmSchedule>>(`/pm/${id}`, input),

  deletePm: (id: string) => apiClient.delete<ApiResponse<{ deleted: true }>>(`/pm/${id}`),

  refreshPmDue: (gymId: string) =>
    apiClient.post<ApiResponse<MachinePmSchedule[]>>('/pm/refresh-due', null, {
      params: { gymId },
    }),

  listRepairs: (gymId: string) =>
    apiClient.get<ApiResponse<MachineRepair[]>>('/repairs', { params: { gymId } }),

  createRepair: (input: CreateMachineRepairInput) =>
    apiClient.post<ApiResponse<MachineRepair>>('/repairs', input),

  listParts: (gymId: string) =>
    apiClient.get<ApiResponse<MachinePart[]>>('/parts', { params: { gymId } }),

  createPart: (input: CreateMachinePartInput) =>
    apiClient.post<ApiResponse<MachinePart>>('/parts', input),

  updatePart: (id: string, input: UpdateMachinePartInput) =>
    apiClient.patch<ApiResponse<MachinePart>>(`/parts/${id}`, input),

  deletePart: (id: string) => apiClient.delete<ApiResponse<{ deleted: true }>>(`/parts/${id}`),

  uploadPhoto: (gymMachineId: string, file: File, imageType = 'CURRENT') => {
    const form = new FormData();
    form.append('file', file);
    form.append('imageType', imageType);
    return apiClient.post<ApiResponse<GymMachinePhoto>>(
      `/gym-machines/${gymMachineId}/photos`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  listPhotos: (gymMachineId: string) =>
    apiClient.get<ApiResponse<GymMachinePhoto[]>>(`/gym-machines/${gymMachineId}/photos`),

  createMemberReport: (input: CreateMemberMachineReportInput) =>
    apiClient.post<ApiResponse<unknown>>('/member-reports', input),

  dashboard: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>('/dashboard', { params: { gymId } }),

  statistics: (gymId: string) =>
    apiClient.get<ApiResponse<InspectionDashboardStats>>('/statistics', { params: { gymId } }),
};
