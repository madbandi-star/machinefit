import type {
  CreateMachineFaultInput,
  CreateMachineInspectionInput,
  CreateMemberMachineReportInput,
} from '@machinefit/shared';
import { inspectionRepository } from '../repositories/inspection.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export const inspectionService = {
  listTemplates(brandId?: string | null) {
    return inspectionRepository.listTemplates(brandId);
  },

  listGymMachinesOps(
    userId: string,
    gymId: string,
    filters: { opsStatus?: string; q?: string },
    roleCode?: string
  ) {
    return inspectionRepository.listGymMachinesOps(userId, gymId, filters, roleCode);
  },

  async getGymMachineOps(userId: string, id: string, roleCode?: string) {
    const machine = await inspectionRepository.getGymMachineOps(userId, id, roleCode);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    return machine;
  },

  async getGymMachineOpsByCode(
    userId: string,
    gymId: string,
    machineCode: string,
    roleCode?: string,
    publicLookup = false
  ) {
    const machine = publicLookup
      ? await inspectionRepository.findGymMachineOpsPublic(gymId, machineCode)
      : await inspectionRepository.getGymMachineOpsByCode(userId, gymId, machineCode, roleCode);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    return machine;
  },

  createInspection(userId: string, input: CreateMachineInspectionInput, roleCode?: string) {
    return inspectionRepository.createInspection(userId, input, roleCode);
  },

  listInspections(
    userId: string,
    query: { gymId: string; gymMachineId?: string; page: number; limit: number },
    roleCode?: string
  ) {
    return inspectionRepository.listInspections(userId, query, roleCode);
  },

  async getInspection(userId: string, id: string, roleCode?: string) {
    const row = await inspectionRepository.getInspection(userId, id, roleCode);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Inspection not found');
    return row;
  },

  createFault(userId: string, input: CreateMachineFaultInput, roleCode?: string) {
    return inspectionRepository.createFault(userId, input, roleCode);
  },

  listFaults(userId: string, gymId: string, roleCode?: string) {
    return inspectionRepository.listFaults(userId, gymId, roleCode);
  },

  updateFault(
    userId: string,
    id: string,
    input: {
      status?: string;
      severity?: string;
      assigneeUserId?: string | null;
      suspectedCause?: string | null;
    },
    roleCode?: string
  ) {
    return inspectionRepository.updateFault(userId, id, input, roleCode);
  },

  createMemberReport(userId: string, input: CreateMemberMachineReportInput) {
    return inspectionRepository.createMemberReport(userId, input);
  },

  dashboard(userId: string, gymId: string, roleCode?: string) {
    return inspectionRepository.dashboard(userId, gymId, roleCode);
  },
};
