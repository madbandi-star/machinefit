import { z } from 'zod';
import { isRoleCode } from '../constants/roles.js';
import type { RoleCode } from '../types/api.types.js';

const roleCodeSchema = z.custom<RoleCode>(
  (value) => isRoleCode(value),
  { message: 'Invalid roleCode' }
);

export const updateUserAdminSchema = z.object({
  roleCode: roleCodeSchema.optional(),
  isActive: z.boolean().optional(),
});

export const moderatePostSchema = z.object({
  isHidden: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const verifyGymSchema = z.object({
  isVerified: z.boolean(),
});

const machineRequestStatusSchema = z.enum([
  'pending',
  'reviewing',
  'rejected',
  'added',
  /** @deprecated Use reviewing — kept for older clients */
  'approved',
]);

export const adminMachineRequestListQuerySchema = z.object({
  brand: z.string().max(100).optional(),
  machineName: z.string().max(200).optional(),
  requester: z.string().max(100).optional(),
  status: z
    .enum(['pending', 'reviewing', 'rejected', 'added', 'approved', 'all'])
    .optional()
    .default('all'),
  dateFrom: z.string().max(40).optional(),
  dateTo: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateMachineRequestAdminSchema = z.object({
  status: machineRequestStatusSchema.optional(),
  adminNote: z.string().max(1000).optional().nullable(),
  rejectReason: z.string().max(1000).optional().nullable(),
  linkedMachineId: z.string().uuid().optional().nullable(),
  isHidden: z.boolean().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  assigneeUserId: z.string().uuid().optional().nullable(),
  /** Apply status/note/link to all requests in the same brand+machine group */
  applyToGroup: z.boolean().optional(),
  groupBrandName: z.string().max(100).optional(),
  groupMachineName: z.string().max(200).optional(),
});

export const adminMachineRequestGroupQuerySchema = z.object({
  brandName: z.string().min(1).max(100),
  machineName: z.string().min(1).max(200),
});

export const mergeMachineRequestGroupsSchema = z.object({
  fromBrandName: z.string().trim().min(1).max(100),
  fromMachineName: z.string().trim().min(1).max(200),
  toBrandName: z.string().trim().min(1).max(100),
  toMachineName: z.string().trim().min(1).max(200),
});

export type AdminMachineRequestListQuery = z.infer<typeof adminMachineRequestListQuerySchema>;
export type AdminMachineRequestGroupQuery = z.infer<typeof adminMachineRequestGroupQuerySchema>;

export const resolveReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;
export type ModeratePostInput = z.infer<typeof moderatePostSchema>;
export type VerifyGymInput = z.infer<typeof verifyGymSchema>;
export type UpdateMachineRequestAdminInput = z.infer<typeof updateMachineRequestAdminSchema>;
export type MergeMachineRequestGroupsInput = z.infer<typeof mergeMachineRequestGroupsSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
