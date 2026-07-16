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

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
