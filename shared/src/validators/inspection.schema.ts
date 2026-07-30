import { z } from 'zod';
import {
  FAULT_SEVERITIES,
  FAULT_STATUSES,
  GYM_MACHINE_PHOTO_TYPES,
  INSPECTION_ITEM_RESULTS,
  MEMBER_REPORT_TYPES,
  PM_CYCLE_TYPES,
} from '../types/inspection.types.js';

export const inspectionItemInputSchema = z.object({
  templateItemId: z.string().uuid().optional().nullable(),
  itemKey: z.string().min(1).max(80).optional(),
  result: z.enum(INSPECTION_ITEM_RESULTS),
  score: z.number().int().min(0).max(100).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal('')),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const createMachineInspectionSchema = z.object({
  gymMachineId: z.string().uuid(),
  inspectionDate: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  note: z.string().max(4000).optional(),
  items: z.array(inspectionItemInputSchema).min(1).max(50),
});

export const createMachineFaultSchema = z.object({
  gymMachineId: z.string().uuid(),
  inspectionId: z.string().uuid().optional(),
  severity: z.enum(FAULT_SEVERITIES).optional(),
  symptom: z.string().min(1).max(2000),
  suspectedCause: z.string().max(2000).optional(),
});

export const patchMachineFaultSchema = z.object({
  status: z.enum(FAULT_STATUSES).optional(),
  severity: z.enum(FAULT_SEVERITIES).optional(),
  assigneeUserId: z.string().uuid().optional().nullable(),
  suspectedCause: z.string().max(2000).optional().nullable(),
});

export const createMemberMachineReportSchema = z.object({
  gymMachineId: z.string().uuid(),
  reportType: z.enum(MEMBER_REPORT_TYPES),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
});

export const inspectionListQuerySchema = z.object({
  gymId: z.string().uuid(),
  gymMachineId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const gymMachinesOpsQuerySchema = z.object({
  gymId: z.string().uuid(),
  opsStatus: z.string().optional(),
  q: z.string().max(100).optional(),
});

export const createMachinePmScheduleSchema = z.object({
  gymMachineId: z.string().uuid(),
  cycleType: z.enum(PM_CYCLE_TYPES),
  usageLimitCount: z.number().int().min(1).optional(),
  usageLimitVolume: z.number().min(0).optional(),
  nextDueAt: z.string().datetime().optional(),
});

export const patchMachinePmScheduleSchema = z.object({
  cycleType: z.enum(PM_CYCLE_TYPES).optional(),
  usageLimitCount: z.number().int().min(1).nullable().optional(),
  usageLimitVolume: z.number().min(0).nullable().optional(),
  nextDueAt: z.string().datetime().nullable().optional(),
  status: z.enum(['SCHEDULED', 'DUE', 'DONE', 'SKIPPED']).optional(),
  markCompleted: z.boolean().optional(),
});

export const createMachineRepairSchema = z.object({
  faultId: z.string().uuid(),
  repairCompany: z.string().max(200).optional(),
  engineer: z.string().max(120).optional(),
  laborCost: z.number().min(0).optional(),
  partsCost: z.number().min(0).optional(),
  repairNote: z.string().max(4000).optional(),
  completedAt: z.string().datetime().optional(),
});

export const createMachinePartSchema = z.object({
  gymMachineId: z.string().uuid(),
  partName: z.string().min(1).max(200),
  replacementCycleDays: z.number().int().min(1).optional(),
  replacementCycleUsage: z.number().int().min(1).optional(),
  lastReplacedAt: z.string().datetime().optional(),
  nextReplaceDate: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
});

export const patchMachinePartSchema = z.object({
  partName: z.string().min(1).max(200).optional(),
  replacementCycleDays: z.number().int().min(1).nullable().optional(),
  replacementCycleUsage: z.number().int().min(1).nullable().optional(),
  lastReplacedAt: z.string().datetime().nullable().optional(),
  nextReplaceDate: z.string().nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
});

export const createInspectionTemplateSchema = z.object({
  brandId: z.string().uuid().optional().nullable(),
  machineCategory: z.string().max(80).optional().nullable(),
  itemKey: z.string().min(1).max(80),
  itemName: z.record(z.string()).default({}),
  displayOrder: z.number().int().min(0).default(0),
  required: z.boolean().default(true),
});

export const patchInspectionTemplateSchema = z.object({
  itemName: z.record(z.string()).optional(),
  displayOrder: z.number().int().min(0).optional(),
  required: z.boolean().optional(),
  active: z.boolean().optional(),
  machineCategory: z.string().max(80).nullable().optional(),
});

export const gymMachinePhotoTypeSchema = z.enum(GYM_MACHINE_PHOTO_TYPES);
