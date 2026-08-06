import { z } from 'zod';
import { TARGET_MUSCLE_GROUPS } from '../constants/workout-goals.js';
import { getUtf8ByteLength, WORKOUT_DIARY_MAX_BYTES } from '../utils/utf8-bytes.js';
import { ALL_GYMS_ID } from '../constants/subscription.js';
import { gymIdSchema, gymScopeIdSchema, memberIdSchema } from './gym-scope.schema.js';

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const diarySchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  })
  .refine((value) => value === undefined || getUtf8ByteLength(value) <= WORKOUT_DIARY_MAX_BYTES, {
    message: `diary must be at most ${WORKOUT_DIARY_MAX_BYTES} bytes`,
  });

export const workoutLogListQuerySchema = z
  .object({
    gymId: gymScopeIdSchema,
    memberId: memberIdSchema.optional(),
    machineCode: z.string().min(1).optional(),
    logDate: dateKeySchema.optional(),
    from: dateKeySchema.optional(),
    to: dateKeySchema.optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.gymId !== ALL_GYMS_ID && !value.memberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'memberId is required when gymId is not all',
        path: ['memberId'],
      });
    }
  });

export type WorkoutLogListQuery = z.infer<typeof workoutLogListQuerySchema>;

export const upsertWorkoutLogSchema = z
  .object({
    gymId: gymIdSchema,
    memberId: memberIdSchema,
    machineCode: z.string().min(1),
    recommendationId: z.string().uuid().optional(),
    logDate: dateKeySchema.optional(),
    setCount: z.number().int().min(1).max(20),
    setWeightsKg: z.array(z.number().min(0).max(999)).min(1).max(20),
    setCompleted: z.array(z.boolean()).optional(),
    diary: diarySchema,
    targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
  })
  .refine((data) => data.setWeightsKg.length === data.setCount, {
    message: 'setWeightsKg length must match setCount',
    path: ['setWeightsKg'],
  })
  .refine(
    (data) =>
      data.setCompleted === undefined || data.setCompleted.length === data.setCount,
    {
      message: 'setCompleted length must match setCount',
      path: ['setCompleted'],
    }
  );

export type UpsertWorkoutLogInput = z.infer<typeof upsertWorkoutLogSchema>;

export const deleteWorkoutLogSchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  machineCode: z.string().min(1),
  logDate: dateKeySchema,
  targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
});

export type DeleteWorkoutLogInput = z.infer<typeof deleteWorkoutLogSchema>;

/** Path param for DELETE /workout-logs/date/:date (and /workout-records alias). */
export const deleteWorkoutLogsByDateParamsSchema = z.object({
  date: dateKeySchema,
});

export type DeleteWorkoutLogsByDateParams = z.infer<typeof deleteWorkoutLogsByDateParamsSchema>;

/** Body for day-scoped delete — own gym/member only; never all-time or multi-day. */
export const deleteWorkoutLogsByDateBodySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
});

export type DeleteWorkoutLogsByDateBody = z.infer<typeof deleteWorkoutLogsByDateBodySchema>;

const workoutRecordOrderItemSchema = z.object({
  machineCode: z.string().min(1),
  targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
  displayOrder: z.number().int().min(0).max(499),
});

/** List display_order rows for a gym/member (optional single day). */
export const workoutRecordDisplayOrderQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  logDate: dateKeySchema.optional(),
});

export type WorkoutRecordDisplayOrderQuery = z.infer<
  typeof workoutRecordDisplayOrderQuerySchema
>;

/**
 * Bulk upsert display_order for one calendar day.
 * Only rows whose order actually changes need to be sent; server updates those in a transaction.
 */
export const reorderWorkoutRecordCardsSchema = z
  .object({
    gymId: gymIdSchema,
    memberId: memberIdSchema,
    logDate: dateKeySchema,
    items: z.array(workoutRecordOrderItemSchema).min(1).max(100),
  })
  .superRefine((value, ctx) => {
    const orders = value.items.map((item) => item.displayOrder);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'displayOrder values must be unique within the day',
        path: ['items'],
      });
    }
  });

export type ReorderWorkoutRecordCardsInput = z.infer<typeof reorderWorkoutRecordCardsSchema>;


export const workoutInsightPeriodSchema = z.enum(['30d', '3m', 'all']);

export const workoutInsightsQuerySchema = z
  .object({
    gymId: gymScopeIdSchema,
    memberId: memberIdSchema.optional(),
    viewMode: z.enum(['machine', 'daily']).default('machine'),
    machineCode: z.string().min(1).optional(),
    period: workoutInsightPeriodSchema.optional().default('30d'),
  })
  .superRefine((value, ctx) => {
    if (value.gymId !== ALL_GYMS_ID && !value.memberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'memberId is required when gymId is not all',
        path: ['memberId'],
      });
    }
  })
  .refine((value) => value.viewMode !== 'machine' || Boolean(value.machineCode), {
    message: 'machineCode is required for machine insights',
    path: ['machineCode'],
  });

export type WorkoutInsightsQuery = z.infer<typeof workoutInsightsQuerySchema>;
