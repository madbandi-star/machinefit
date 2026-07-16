import { z } from 'zod';

export const updateUserAdminSchema = z.object({
  roleCode: z.enum(['member', 'owner', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const moderatePostSchema = z.object({
  isHidden: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const verifyGymSchema = z.object({
  isVerified: z.boolean(),
});

export const updateMachineRequestAdminSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'added']),
  adminNote: z.string().max(1000).optional(),
});

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
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
