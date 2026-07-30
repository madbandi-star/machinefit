import type {
  CreateMachineFaultInput,
  CreateMachineInspectionInput,
  CreateMachinePartInput,
  CreateMachinePmScheduleInput,
  CreateMachineRepairInput,
  CreateMemberMachineReportInput,
  GymMachinePhotoType,
  PmCycleType,
  UpdateMachinePartInput,
} from '@machinefit/shared';
import { inspectionRepository } from '../repositories/inspection.repository.js';
import {
  inspectionOpsRepository,
  listGymManagerUserIds,
} from '../repositories/inspection-ops.repository.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { storageService } from './storage.service.js';
import { randomUUID } from 'node:crypto';

async function notifyGymManagers(
  gymId: string,
  type: Parameters<typeof notificationService.notify>[1],
  titleKo: string,
  bodyKo: string,
  payload?: Record<string, unknown>
): Promise<void> {
  const userIds = await listGymManagerUserIds(gymId);
  await Promise.all(
    userIds.map((userId) =>
      notificationService.notify(
        userId,
        type,
        { ko: titleKo, en: titleKo },
        { ko: bodyKo, en: bodyKo },
        payload
      )
    )
  );
}

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

  /** Public detail for QR landing (any authenticated user). */
  async getGymMachineOpsPublic(idOrCode: string) {
    const byQr = await inspectionOpsRepository.findGymMachineByQr(idOrCode);
    if (!byQr) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    const summary = await inspectionRepository.findGymMachineOpsPublic(
      byQr.gymId,
      byQr.gymMachineId
    );
    if (!summary) throw new AppError(404, 'NOT_FOUND', 'Gym machine not found');
    return summary;
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

  async createInspection(userId: string, input: CreateMachineInspectionInput, roleCode?: string) {
    const result = await inspectionRepository.createInspection(userId, input, roleCode);
    if (result.inspectionResult === 'FAIL') {
      await notifyGymManagers(
        result.gymId,
        'machine_fault',
        '점검 FAIL — 고장접수',
        `${result.machineName || result.machineCode || '기구'} 점검에서 FAIL이 발생했습니다.`,
        {
          gymId: result.gymId,
          gymMachineId: result.gymMachineId,
          inspectionId: result.id,
          deepLink: '/owner/equipment/faults',
        }
      );
    }
    return result;
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

  async createFault(userId: string, input: CreateMachineFaultInput, roleCode?: string) {
    const fault = await inspectionRepository.createFault(userId, input, roleCode);
    await notifyGymManagers(
      fault.gymId,
      'machine_fault',
      '고장접수',
      fault.symptom.slice(0, 120),
      {
        gymId: fault.gymId,
        gymMachineId: fault.gymMachineId,
        faultId: fault.id,
        deepLink: '/owner/equipment/faults',
      }
    );
    return fault;
  },

  listFaults(userId: string, gymId: string, roleCode?: string) {
    return inspectionRepository.listFaults(userId, gymId, roleCode);
  },

  async updateFault(
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
    const fault = await inspectionRepository.updateFault(userId, id, input, roleCode);
    if (input.status === 'DONE') {
      await notifyGymManagers(
        fault.gymId,
        'machine_repair_done',
        '수리/고장 처리 완료',
        fault.symptom.slice(0, 120),
        { gymId: fault.gymId, faultId: fault.id, deepLink: '/owner/equipment/faults' }
      );
    }
    return fault;
  },

  async createMemberReport(userId: string, input: CreateMemberMachineReportInput) {
    const report = await inspectionRepository.createMemberReport(userId, input);
    await notifyGymManagers(
      report.gymId,
      'member_machine_report',
      '회원 기구 이상 신고',
      `${report.reportType}${report.description ? ` — ${report.description.slice(0, 80)}` : ''}`,
      {
        gymId: report.gymId,
        gymMachineId: report.gymMachineId,
        reportId: report.id,
        deepLink: '/owner/equipment/faults',
      }
    );
    return report;
  },

  dashboard(userId: string, gymId: string, roleCode?: string) {
    return inspectionRepository.dashboard(userId, gymId, roleCode);
  },

  statistics(userId: string, gymId: string, roleCode?: string) {
    return inspectionOpsRepository.extendedStatistics(userId, gymId, roleCode);
  },

  listPm(userId: string, gymId: string, roleCode?: string) {
    return inspectionOpsRepository.listPm(userId, gymId, roleCode);
  },

  createPm(userId: string, input: CreateMachinePmScheduleInput, roleCode?: string) {
    return inspectionOpsRepository.createPm(userId, input, roleCode);
  },

  updatePm(
    userId: string,
    id: string,
    input: {
      cycleType?: PmCycleType;
      usageLimitCount?: number | null;
      usageLimitVolume?: number | null;
      nextDueAt?: string | null;
      status?: 'SCHEDULED' | 'DUE' | 'DONE' | 'SKIPPED';
      markCompleted?: boolean;
    },
    roleCode?: string
  ) {
    return inspectionOpsRepository.updatePm(userId, id, input, roleCode);
  },

  deletePm(userId: string, id: string, roleCode?: string) {
    return inspectionOpsRepository.deletePm(userId, id, roleCode);
  },

  async refreshPmDue(userId: string, gymId: string, roleCode?: string) {
    const due = await inspectionOpsRepository.refreshPmDue(userId, gymId, roleCode);
    if (due.length) {
      await notifyGymManagers(
        gymId,
        'pm_due',
        '예방정비 예정',
        `${due.length}건의 PM이 도래했습니다.`,
        { gymId, count: due.length, deepLink: '/owner/equipment/pm' }
      );
    }
    // Parts due soon (within 7 days)
    const parts = await inspectionOpsRepository.listParts(userId, gymId, roleCode);
    const soon = parts.filter((p) => {
      if (!p.nextReplaceDate) return false;
      const d = new Date(p.nextReplaceDate).getTime() - Date.now();
      return d <= 7 * 86_400_000;
    });
    if (soon.length) {
      await notifyGymManagers(
        gymId,
        'part_replace_due',
        '부품 교체 예정',
        `${soon.length}개 부품 교체 예정일이 임박했습니다.`,
        { gymId, count: soon.length, deepLink: '/owner/equipment/parts' }
      );
    }
    return due;
  },

  listRepairs(userId: string, gymId: string, roleCode?: string) {
    return inspectionOpsRepository.listRepairs(userId, gymId, roleCode);
  },

  async createRepair(
    userId: string,
    input: CreateMachineRepairInput,
    roleCode?: string
  ) {
    const repair = await inspectionOpsRepository.createRepair(userId, input, roleCode);
    await notifyGymManagers(
      repair.gymId,
      'machine_repair_done',
      '수리 완료',
      `수리비 ₩${repair.totalCost.toLocaleString()}`,
      { gymId: repair.gymId, repairId: repair.id, deepLink: '/owner/equipment/repairs' }
    );
    return repair;
  },

  listParts(userId: string, gymId: string, roleCode?: string) {
    return inspectionOpsRepository.listParts(userId, gymId, roleCode);
  },

  createPart(userId: string, input: CreateMachinePartInput, roleCode?: string) {
    return inspectionOpsRepository.createPart(userId, input, roleCode);
  },

  updatePart(userId: string, id: string, input: UpdateMachinePartInput, roleCode?: string) {
    return inspectionOpsRepository.updatePart(userId, id, input, roleCode);
  },

  deletePart(userId: string, id: string, roleCode?: string) {
    return inspectionOpsRepository.deletePart(userId, id, roleCode);
  },

  createTemplate(
    userId: string,
    input: {
      brandId?: string | null;
      machineCategory?: string | null;
      itemKey: string;
      itemName: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
    },
    roleCode?: string
  ) {
    return inspectionOpsRepository.createTemplate(userId, input, roleCode);
  },

  updateTemplate(
    userId: string,
    id: string,
    input: {
      itemName?: Record<string, string>;
      displayOrder?: number;
      required?: boolean;
      active?: boolean;
      machineCategory?: string | null;
    },
    roleCode?: string
  ) {
    return inspectionOpsRepository.updateTemplate(userId, id, input, roleCode);
  },

  listPhotos(userId: string, gymMachineId: string, roleCode?: string) {
    return inspectionOpsRepository.listPhotos(userId, gymMachineId, roleCode);
  },

  async uploadPhoto(
    userId: string,
    gymMachineId: string,
    imageType: GymMachinePhotoType,
    file: { buffer: Buffer; mimetype: string; originalname?: string },
    roleCode?: string
  ) {
    const ext =
      file.mimetype.includes('png')
        ? 'png'
        : file.mimetype.includes('webp')
          ? 'webp'
          : 'jpg';
    const stored = await storageService.saveGymMachinePhoto({
      gymMachineId,
      photoId: randomUUID(),
      extension: ext,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
    return inspectionOpsRepository.addPhoto(
      userId,
      gymMachineId,
      imageType,
      stored.publicUrl,
      roleCode
    );
  },
};
