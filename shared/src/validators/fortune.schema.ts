import { z } from 'zod';

export const fortuneContentCategorySchema = z.enum([
  'keyword',
  'headline',
  'strategy',
  'pre_workout',
  'post_workout',
  'avoid',
  'one_liner',
  'style',
  'condition',
  'body_part',
]);

export const fortuneContentCreateSchema = z.object({
  category: fortuneContentCategorySchema,
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9_]+$/, 'code must be UPPER_SNAKE'),
  locale: z.string().min(2).max(8).default('ko'),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional().default(''),
  priority: z.number().int().min(0).max(9999).optional().default(100),
  isActive: z.boolean().optional().default(true),
  dataConditions: z.record(z.unknown()).nullable().optional(),
  scoreWeights: z.record(z.number()).nullable().optional(),
});

export const fortuneContentUpdateSchema = z
  .object({
    category: fortuneContentCategorySchema.optional(),
    code: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z0-9_]+$/)
      .optional(),
    locale: z.string().min(2).max(8).optional(),
    title: z.string().min(1).max(200).optional(),
    body: z.string().max(2000).optional(),
    priority: z.number().int().min(0).max(9999).optional(),
    isActive: z.boolean().optional(),
    dataConditions: z.record(z.unknown()).nullable().optional(),
    scoreWeights: z.record(z.number()).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const fortuneTodayQuerySchema = z.object({
  gymId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  locale: z.string().min(2).max(8).optional(),
});

export type FortuneContentCreateInput = z.infer<typeof fortuneContentCreateSchema>;
export type FortuneContentUpdateInput = z.infer<typeof fortuneContentUpdateSchema>;
