import { z } from 'zod';

export const createPostSchema = z.object({
  boardType: z.enum(['free', 'announcement']),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  languageCode: z.enum(['ko', 'en', 'ja', 'zh']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const machineRequestListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(18),
  sort: z.enum(['latest', 'popular', 'views', 'comments', 'votes']).default('latest'),
  q: z.string().trim().max(100).optional(),
  likedByMe: z.coerce.boolean().optional(),
  mine: z.coerce.boolean().optional(),
  /** When true, include rejected/hidden (still never shows others' hidden). Default false. */
  includeClosed: z.coerce.boolean().optional(),
});

export const updateMachineRequestSchema = z
  .object({
    brandName: z.string().trim().min(1).max(100).optional(),
    machineName: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    gymChoiceMode: z.enum(['profile', 'custom', 'unknown']).optional(),
    gymName: z.string().trim().max(50).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type MachineRequestListQuery = z.infer<typeof machineRequestListQuerySchema>;
export type MachineRequestSort = MachineRequestListQuery['sort'];
export type UpdateMachineRequestInput = z.infer<typeof updateMachineRequestSchema>;
