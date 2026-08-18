import { z } from 'zod';
import { MACHINE_RARITY_GRADES } from '../utils/machine-rarity.js';

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[\p{L}\p{N}_-]+$/u, 'Invalid tag');

export const machineShowcaseTabSchema = z.enum(['popular', 'latest', 'myGym', 'nearby']);
export const machineShowcaseSortSchema = z.enum(['latest', 'popular']);

export const machineShowcaseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  tab: machineShowcaseTabSchema.default('latest'),
  sort: machineShowcaseSortSchema.optional(),
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(40).optional(),
  machineCode: z.string().trim().max(80).optional(),
  gymId: z.string().uuid().optional(),
  userGymId: z.string().uuid().optional(),
  grade: z.enum(MACHINE_RARITY_GRADES).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(80).optional(),
  bookmarkedByMe: z.coerce.boolean().optional(),
  mine: z.coerce.boolean().optional(),
});

export const createMachineShowcasePostSchema = z
  .object({
    machineCode: z.string().trim().min(1).max(80),
    caption: z.string().trim().max(500).default(''),
    tags: z.array(tagSchema).max(8).default([]),
    userGymId: z.string().uuid().optional(),
    gymId: z.string().uuid().optional(),
  })
  .refine((v) => Boolean(v.userGymId || v.gymId), {
    message: 'userGymId or gymId required',
  });

export const updateMachineShowcasePostSchema = z.object({
  caption: z.string().trim().max(500).optional(),
  tags: z.array(tagSchema).max(8).optional(),
});

export const createMachineShowcaseCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const updateMachineShowcaseCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const createMachineShowcaseReportSchema = z
  .object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reason: z.enum([
      'inappropriate',
      'spam',
      'duplicate',
      'wrong_machine',
      'personal_info',
      'other',
    ]),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((v) => Boolean(v.postId || v.commentId), {
    message: 'postId or commentId required',
  });

export const resolveMachineShowcaseReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export const claimGymMachineSchema = z.object({
  userGymId: z.string().uuid(),
  machineCode: z.string().trim().min(1).max(80),
  sourcePostId: z.string().uuid().optional(),
});

export const adminMachineShowcasePostPatchSchema = z.object({
  isHidden: z.boolean().optional(),
  machineCode: z.string().trim().min(1).max(80).optional(),
  gymId: z.string().uuid().nullable().optional(),
  userGymId: z.string().uuid().nullable().optional(),
  coverImageId: z.string().uuid().optional(),
});

export const adminMachineRarityPatchSchema = z.object({
  adminWeight: z.number().int().min(-100).max(100).optional(),
  uniqueFlag: z.boolean().optional(),
  gradeOverride: z.enum(MACHINE_RARITY_GRADES).nullable().optional(),
});

export const adminMachineRarityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(80).optional(),
  grade: z.enum(MACHINE_RARITY_GRADES).optional(),
});

export const machineShowcaseNearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.5).max(80).default(15),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export type MachineShowcaseListQuery = z.infer<typeof machineShowcaseListQuerySchema>;
export type CreateMachineShowcasePostInput = z.infer<typeof createMachineShowcasePostSchema>;
export type UpdateMachineShowcasePostInput = z.infer<typeof updateMachineShowcasePostSchema>;
export type CreateMachineShowcaseCommentInput = z.infer<typeof createMachineShowcaseCommentSchema>;
export type UpdateMachineShowcaseCommentInput = z.infer<typeof updateMachineShowcaseCommentSchema>;
export type CreateMachineShowcaseReportInput = z.infer<typeof createMachineShowcaseReportSchema>;
export type ResolveMachineShowcaseReportInput = z.infer<typeof resolveMachineShowcaseReportSchema>;
export type ClaimGymMachineInput = z.infer<typeof claimGymMachineSchema>;
export type AdminMachineShowcasePostPatch = z.infer<typeof adminMachineShowcasePostPatchSchema>;
export type AdminMachineRarityPatch = z.infer<typeof adminMachineRarityPatchSchema>;
export type AdminMachineRarityListQuery = z.infer<typeof adminMachineRarityListQuerySchema>;
