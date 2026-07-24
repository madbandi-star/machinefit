import { z } from 'zod';
import {
  ONLINE_PT_DEADLINE_HOURS,
  ONLINE_PT_OVERDUE_ACTIONS,
  ONLINE_PT_PRODUCT_TYPES,
  ONLINE_PT_QUESTION_STATUSES,
  ONLINE_PT_TRAINER_SORTS,
} from '../types/online-pt.types.js';

const urlList = z.array(z.string().trim().url().max(1000)).max(10).optional();

export const updateOnlinePtPolicySchema = z
  .object({
    minTicketPrice: z.number().int().min(0).max(1_000_000).optional(),
    maxTicketPrice: z.number().int().min(0).max(1_000_000).optional(),
    platformFeePercent: z.number().min(0).max(100).optional(),
    answerDeadlineHours: z
      .union([z.literal(24), z.literal(48), z.literal(72), z.coerce.number()])
      .refine((v): v is (typeof ONLINE_PT_DEADLINE_HOURS)[number] =>
        (ONLINE_PT_DEADLINE_HOURS as readonly number[]).includes(Number(v))
      )
      .optional(),
    overdueAction: z.enum(ONLINE_PT_OVERDUE_ACTIONS).optional(),
    followupDays: z.number().int().min(0).max(90).optional(),
    followupMaxCount: z.number().int().min(0).max(20).optional(),
    minPayoutAmount: z.number().int().min(0).max(100_000_000).optional(),
    trainerApprovalRequired: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.minTicketPrice == null ||
      v.maxTicketPrice == null ||
      v.minTicketPrice <= v.maxTicketPrice,
    { message: 'minTicketPrice must be <= maxTicketPrice' }
  );

export const upsertOnlinePtTrainerProfileSchema = z.object({
  ticketPrice: z.number().int().min(0).max(1_000_000),
  acceptingQuestions: z.boolean(),
  maxQuestionsPerDay: z.number().int().min(0).max(200),
  avgAnswerTargetHours: z.number().int().min(1).max(168),
  specialties: z.array(z.string().trim().min(1).max(40)).max(20),
  intro: z.string().trim().max(4000),
  career: z.string().trim().max(4000).optional().default(''),
  certifications: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  regionLabel: z.string().trim().max(120).optional().default(''),
  gymName: z.string().trim().max(120).optional().default(''),
  avatarUrl: z.string().trim().url().max(1000).optional().nullable(),
  isOnline: z.boolean().optional(),
});

export const purchaseOnlinePtTicketsSchema = z.object({
  trainerId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  productType: z.enum(ONLINE_PT_PRODUCT_TYPES).optional().default('trainer_specific'),
});

export const createOnlinePtQuestionSchema = z.object({
  trainerId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  workoutGoal: z.string().trim().max(40).optional().nullable(),
  machineCode: z.string().trim().max(80).optional().nullable(),
  brandCode: z.string().trim().max(80).optional().nullable(),
  muscleGroup: z.string().trim().max(80).optional().nullable(),
  photoUrls: urlList.default([]),
  videoUrls: urlList.default([]),
  workoutLogRef: z.string().trim().max(200).optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  productType: z.enum(ONLINE_PT_PRODUCT_TYPES).optional().default('trainer_specific'),
});

export const createOnlinePtAnswerSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  photoUrls: urlList.default([]),
  videoUrls: urlList.default([]),
  audioUrls: urlList.default([]),
});

export const createOnlinePtFollowupSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  photoUrls: urlList.default([]),
  videoUrls: urlList.default([]),
});

export const createOnlinePtReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(2000).optional().default(''),
});

export const listOnlinePtTrainersSchema = z.object({
  sort: z.enum(ONLINE_PT_TRAINER_SORTS).optional().default('popular'),
  q: z.string().trim().max(80).optional(),
  specialty: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  acceptingOnly: z
    .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
    .optional()
    .transform((v) => v === true || v === 'true' || v === '1')
    .default(true),
});

export const listOnlinePtQuestionsSchema = z.object({
  role: z.enum(['member', 'trainer', 'admin']).optional(),
  status: z.enum(ONLINE_PT_QUESTION_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createOnlinePtPayoutSchema = z.object({
  amount: z.number().int().min(1).max(100_000_000),
});

export const reviewOnlinePtPayoutSchema = z.object({
  status: z.enum(['approved', 'rejected', 'paid']),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

export const reviewOnlinePtTrainerSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected', 'suspended', 'pending']),
});

export const resolveOnlinePtReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});
