import { z } from 'zod';
import {
  FAULT_SEVERITIES,
  FAULT_STATUSES,
  INSPECTION_ITEM_RESULTS,
  MEMBER_REPORT_TYPES,
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
