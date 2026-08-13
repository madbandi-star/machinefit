import { z } from 'zod';
import {
  TEMPLATE_SHARE_CATEGORIES,
  TEMPLATE_SHARE_DIFFICULTIES,
  TEMPLATE_SHARE_REPORT_REASONS,
  TEMPLATE_SHARE_REPORT_STATUSES,
  TEMPLATE_SHARE_SORTS,
  TEMPLATE_SHARE_STATUSES,
} from '../constants/template-share.js';

export const templateShareListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
  category: z.enum(TEMPLATE_SHARE_CATEGORIES).optional(),
  difficulty: z.enum(TEMPLATE_SHARE_DIFFICULTIES).optional(),
  sort: z.enum(TEMPLATE_SHARE_SORTS).optional().default('latest'),
  tag: z.string().trim().max(40).optional(),
  authorId: z.string().uuid().optional(),
  favoritedByMe: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});
export type TemplateShareListQuery = z.infer<typeof templateShareListQuerySchema>;

export const publishTemplateShareSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).default(''),
  category: z.enum(TEMPLATE_SHARE_CATEGORIES).default('general'),
  difficulty: z.enum(TEMPLATE_SHARE_DIFFICULTIES).default('beginner'),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  thumbnailUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v) || v.startsWith('/'),
      'thumbnailUrl must be http(s) or app-relative'
    ),
  youtubeUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => !v || /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(v),
      'youtubeUrl must be a YouTube http(s) link'
    ),
  youtubeChannelName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  instagramId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .transform((v) => {
      if (!v) return null;
      return v.replace(/^@+/, '').trim() || null;
    })
    .refine(
      (v) => !v || /^[A-Za-z0-9._]{1,30}$/.test(v),
      'instagramId must be a valid Instagram handle'
    ),
});
export type PublishTemplateShareInput = z.infer<typeof publishTemplateShareSchema>;

export const updateTemplateShareSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(TEMPLATE_SHARE_CATEGORIES).optional(),
  difficulty: z.enum(TEMPLATE_SHARE_DIFFICULTIES).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
  thumbnailUrl: z.string().trim().max(2000).optional().nullable(),
  youtubeUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v == null ? v : v.length > 0 ? v : null))
    .refine(
      (v) => v == null || v === '' || /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\//i.test(v),
      'youtubeUrl must be a YouTube http(s) link'
    ),
  youtubeChannelName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((v) => (v == null ? v : v.length > 0 ? v : null)),
  instagramId: z
    .string()
    .trim()
    .max(64)
    .optional()
    .nullable()
    .transform((v) => {
      if (v == null) return v;
      if (!v) return null;
      return v.replace(/^@+/, '').trim() || null;
    })
    .refine(
      (v) => v == null || v === '' || /^[A-Za-z0-9._]{1,30}$/.test(v),
      'instagramId must be a valid Instagram handle'
    ),
  status: z.enum(['published', 'hidden']).optional(),
});
export type UpdateTemplateShareInput = z.infer<typeof updateTemplateShareSchema>;

export const templateShareIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const templateShareCommentBodySchema = z.object({
  content: z.string().trim().min(1).max(1000),
});
export type TemplateShareCommentBody = z.infer<typeof templateShareCommentBodySchema>;

export const templateShareReportBodySchema = z.object({
  reason: z.enum(TEMPLATE_SHARE_REPORT_REASONS),
  description: z.string().trim().max(1000).default(''),
  commentId: z.string().uuid().optional(),
});
export type TemplateShareReportBody = z.infer<typeof templateShareReportBodySchema>;

export const templateShareAdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(TEMPLATE_SHARE_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});
export type TemplateShareAdminListQuery = z.infer<typeof templateShareAdminListQuerySchema>;

export const templateShareAdminStatusSchema = z.object({
  status: z.enum(TEMPLATE_SHARE_STATUSES),
});

export const templateShareReportResolveSchema = z.object({
  status: z.enum(TEMPLATE_SHARE_REPORT_STATUSES),
});
