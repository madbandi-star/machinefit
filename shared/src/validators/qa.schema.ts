import { z } from 'zod';
import { QA_CATEGORIES, QA_FEEDBACK_VALUES, QA_PRIORITIES } from '../constants/qa.js';

export const qaCategorySchema = z.enum(QA_CATEGORIES);
export const qaPrioritySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const qaListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: qaCategorySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  popularLimit: z.coerce.number().int().min(0).max(20).default(5),
  /** Admin-only: include unpublished. */
  includeUnpublished: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  sort: z.enum(['priority', 'views', 'helpful', 'order', 'updated']).optional(),
});

export type QaListQuery = z.infer<typeof qaListQuerySchema>;

export const qaIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const qaFeedbackBodySchema = z.object({
  value: z.enum(QA_FEEDBACK_VALUES),
});

export const createQaArticleSchema = z.object({
  category: qaCategorySchema,
  priority: qaPrioritySchema.default(2),
  title: z.string().trim().min(2).max(200),
  answer: z.string().trim().min(10).max(20000),
  keywords: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  displayOrder: z.number().int().min(0).max(1_000_000).default(0),
  isPublished: z.boolean().default(true),
  needsImplReview: z.boolean().default(false),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullable()
    .optional(),
});

export type CreateQaArticleInput = z.infer<typeof createQaArticleSchema>;

export const updateQaArticleSchema = createQaArticleSchema.partial().extend({
  viewCount: z.number().int().min(0).optional(),
});

export type UpdateQaArticleInput = z.infer<typeof updateQaArticleSchema>;

export const qaReorderBodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        displayOrder: z.number().int().min(0).max(1_000_000),
      })
    )
    .min(1)
    .max(500),
});

export type QaReorderBody = z.infer<typeof qaReorderBodySchema>;

export const qaPublishBodySchema = z.object({
  isPublished: z.boolean(),
});

/** Keep priorities typed even if unused directly by zod default path. */
void QA_PRIORITIES;
