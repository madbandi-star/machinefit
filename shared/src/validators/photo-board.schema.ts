import { z } from 'zod';

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[\p{L}\p{N}_-]+$/u, 'Invalid tag');

export const photoBoardSortSchema = z.enum(['latest', 'popular', 'views', 'comments']);

export const photoBoardListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(18),
  sort: photoBoardSortSchema.default('latest'),
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(40).optional(),
  authorId: z.string().uuid().optional(),
  likedByMe: z.coerce.boolean().optional(),
  mine: z.coerce.boolean().optional(),
});

export const createPhotoPostSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().max(5000).default(''),
  tags: z.array(tagSchema).max(10).default([]),
});

export const updatePhotoPostSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().max(5000).optional(),
  tags: z.array(tagSchema).max(10).optional(),
  imageOrder: z.array(z.string().uuid()).max(10).optional(),
});

export const createPhotoCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const createPhotoReportSchema = z
  .object({
    postId: z.string().uuid().optional(),
    commentId: z.string().uuid().optional(),
    reason: z.enum(['spam', 'abuse', 'nsfw', 'copyright', 'other']),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((v) => Boolean(v.postId || v.commentId), {
    message: 'postId or commentId required',
  });

export const resolvePhotoReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});

export const blockPhotoUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export type PhotoBoardListQuery = z.infer<typeof photoBoardListQuerySchema>;
export type CreatePhotoPostInput = z.infer<typeof createPhotoPostSchema>;
export type UpdatePhotoPostInput = z.infer<typeof updatePhotoPostSchema>;
export type CreatePhotoCommentInput = z.infer<typeof createPhotoCommentSchema>;
export type CreatePhotoReportInput = z.infer<typeof createPhotoReportSchema>;
export type ResolvePhotoReportInput = z.infer<typeof resolvePhotoReportSchema>;
export type BlockPhotoUserInput = z.infer<typeof blockPhotoUserSchema>;
