import { z } from 'zod';
import {
  NOTICE_CATEGORIES,
  NOTICE_LANGUAGES,
  NOTICE_STATUSES,
} from '../constants/notice.js';

const languageSchema = z.enum(NOTICE_LANGUAGES);

const translationSchema = z.object({
  language: languageSchema,
  title: z.string().trim().min(1).max(200),
  content: z.string().max(200_000),
});

export const noticeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(NOTICE_CATEGORIES).optional(),
  status: z.enum(NOTICE_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  searchIn: z.enum(['title', 'content', 'both']).optional().default('both'),
  language: languageSchema.optional(),
  includeDrafts: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

export type NoticeListQuery = z.infer<typeof noticeListQuerySchema>;

const noticeWriteBaseSchema = z.object({
  category: z.enum(NOTICE_CATEGORIES).default('notice'),
  status: z.enum(NOTICE_STATUSES).default('DRAFT'),
  isPinned: z.boolean().optional().default(false),
  isImportant: z.boolean().optional().default(false),
  isBanner: z.boolean().optional().default(false),
  isPopup: z.boolean().optional().default(false),
  publishAt: z.string().datetime().optional().nullable(),
  translations: z.array(translationSchema).min(1).max(4),
});

function refineNoticeWrite(
  value: { status?: string; publishAt?: string | null; translations?: { language: string }[] },
  ctx: z.RefinementCtx
): void {
  if (value.translations) {
    const langs = value.translations.map((t) => t.language);
    if (new Set(langs).size !== langs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate translation language',
        path: ['translations'],
      });
    }
  }
  if (value.status === 'RESERVED' && !value.publishAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'publishAt is required for RESERVED status',
      path: ['publishAt'],
    });
  }
}

export const createNoticeSchema = noticeWriteBaseSchema.superRefine(refineNoticeWrite);

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;

export const updateNoticeSchema = noticeWriteBaseSchema
  .partial()
  .extend({
    translations: z.array(translationSchema).min(1).max(4).optional(),
  })
  .superRefine(refineNoticeWrite);

export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;

export const noticeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const noticePublishBodySchema = z.object({
  publishAt: z.string().datetime().optional().nullable(),
  status: z.enum(['PUBLISHED', 'HIDDEN', 'DRAFT', 'RESERVED']).optional(),
});

export type NoticePublishBody = z.infer<typeof noticePublishBodySchema>;

export const noticeFlagBodySchema = z.object({
  value: z.boolean(),
});

export type NoticeFlagBody = z.infer<typeof noticeFlagBodySchema>;
