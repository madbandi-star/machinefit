import { z } from 'zod';
import { TARGET_MUSCLE_GROUPS } from '../constants/workout-goals.js';
import { WORKOUT_CARD_STATUSES } from '../constants/workout-card.js';
import { getUtf8ByteLength, WORKOUT_DIARY_MAX_BYTES } from '../utils/utf8-bytes.js';
import { gymIdSchema, memberIdSchema } from './gym-scope.schema.js';

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

const statusSchema = z.enum(WORKOUT_CARD_STATUSES);

/** Optional voice-count prefs on cards / template items (clamped client-side). */
export const workoutCardVoicePrefsSchema = z
  .object({
    targetReps: z.number().int().min(1).max(100).optional(),
    repGapMs: z.number().int().min(800).max(10000).optional(),
    oneMoreCount: z.number().int().min(0).max(20).optional(),
    holdDurationSec: z.number().int().min(1).max(600).optional(),
    voiceEnabled: z.boolean().optional(),
    voicePack: z.string().trim().min(1).max(40).optional(),
    countMode: z.string().trim().min(1).max(40).optional(),
    prepCount: z.number().int().min(0).max(20).optional(),
    flowMode: z.string().trim().min(1).max(40).optional(),
    oneMoreEnabled: z.boolean().optional(),
    autoAfterRest: z.boolean().optional(),
    restTipsEnabled: z.boolean().optional(),
  })
  .strict();

export type WorkoutCardVoicePrefsInput = z.infer<typeof workoutCardVoicePrefsSchema>;

export const workoutCardListQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  scheduledDate: dateKeySchema.optional(),
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  status: z
    .union([statusSchema, z.array(statusSchema)])
    .optional()
    .transform((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v])),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export type WorkoutCardListQuery = z.infer<typeof workoutCardListQuerySchema>;

export const createWorkoutCardSchema = z
  .object({
    gymId: gymIdSchema,
    memberId: memberIdSchema,
    machineCode: z.string().min(1),
    recommendationId: z.string().uuid().optional(),
    scheduledDate: dateKeySchema,
    status: statusSchema.optional(),
    setCount: z.number().int().min(1).max(20).default(1),
    setWeightsKg: z.array(z.number().min(0).max(999)).min(1).max(20).default([0]),
    setReps: z.array(z.number().int().min(0).max(999)).max(20).optional(),
    setCompleted: z.array(z.boolean()).optional(),
    diary: diarySchema,
    restSeconds: z.number().int().min(0).max(7200).optional(),
    voicePrefs: workoutCardVoicePrefsSchema.optional(),
    displayOrder: z.number().int().min(0).max(499).optional(),
    targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
    templateId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.setWeightsKg.length !== data.setCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'setWeightsKg length must match setCount',
        path: ['setWeightsKg'],
      });
    }
    if (data.setReps && data.setReps.length !== data.setCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'setReps length must match setCount',
        path: ['setReps'],
      });
    }
    if (data.setCompleted && data.setCompleted.length !== data.setCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'setCompleted length must match setCount',
        path: ['setCompleted'],
      });
    }
  });

export type CreateWorkoutCardInput = z.infer<typeof createWorkoutCardSchema>;

export const updateWorkoutCardSchema = z
  .object({
    setCount: z.number().int().min(1).max(20).optional(),
    setWeightsKg: z.array(z.number().min(0).max(999)).min(1).max(20).optional(),
    setReps: z.array(z.number().int().min(0).max(999)).max(20).optional(),
    setCompleted: z.array(z.boolean()).optional(),
    diary: diarySchema,
    restSeconds: z.number().int().min(0).max(7200).nullable().optional(),
    voicePrefs: workoutCardVoicePrefsSchema.nullable().optional(),
    displayOrder: z.number().int().min(0).max(499).optional(),
    recommendationId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

export type UpdateWorkoutCardInput = z.infer<typeof updateWorkoutCardSchema>;

export const patchWorkoutCardStatusSchema = z.object({
  status: statusSchema,
});

export type PatchWorkoutCardStatusInput = z.infer<typeof patchWorkoutCardStatusSchema>;

export const moveWorkoutCardDateSchema = z.object({
  scheduledDate: dateKeySchema,
});

export type MoveWorkoutCardDateInput = z.infer<typeof moveWorkoutCardDateSchema>;

export const copyWorkoutCardSchema = z.object({
  scheduledDate: dateKeySchema,
  status: statusSchema.optional(),
});

export type CopyWorkoutCardInput = z.infer<typeof copyWorkoutCardSchema>;

export const workoutCardIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type WorkoutCardIdParams = z.infer<typeof workoutCardIdParamsSchema>;

export const createWorkoutCardTemplateSchema = z.object({
  gymId: gymIdSchema.optional(),
  name: z.string().trim().min(1).max(80),
  /** Source date to snapshot, or explicit items. */
  fromDate: dateKeySchema.optional(),
  items: z
    .array(
      z.object({
        machineCode: z.string().min(1),
        targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
        setCount: z.number().int().min(1).max(20),
        setWeightsKg: z.array(z.number().min(0).max(999)).min(1).max(20),
        setReps: z.array(z.number().int().min(0).max(999)).max(20).optional(),
        diary: diarySchema,
        restSeconds: z.number().int().min(0).max(7200).optional(),
        displayOrder: z.number().int().min(0).max(499).default(0),
        recommendationId: z.string().uuid().optional(),
        voicePrefs: workoutCardVoicePrefsSchema.optional(),
      })
    )
    .optional(),
});

export type CreateWorkoutCardTemplateInput = z.infer<typeof createWorkoutCardTemplateSchema>;

export const applyWorkoutCardTemplateSchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  scheduledDate: dateKeySchema,
  templateId: z.string().uuid(),
});

export type ApplyWorkoutCardTemplateInput = z.infer<typeof applyWorkoutCardTemplateSchema>;

export const workoutCardMissedQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
});

export type WorkoutCardMissedQuery = z.infer<typeof workoutCardMissedQuerySchema>;

export const resolveMissedWorkoutCardSchema = z.object({
  action: z.enum(['move_today', 'move_date', 'delete', 'dismiss']),
  scheduledDate: dateKeySchema.optional(),
});

export type ResolveMissedWorkoutCardInput = z.infer<typeof resolveMissedWorkoutCardSchema>;

export const workoutPlanStatsQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
});

export type WorkoutPlanStatsQuery = z.infer<typeof workoutPlanStatsQuerySchema>;

export const workoutCardCalendarSummaryQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema,
  from: dateKeySchema,
  to: dateKeySchema,
});

export type WorkoutCardCalendarSummaryQuery = z.infer<
  typeof workoutCardCalendarSummaryQuerySchema
>;

export const workoutCardTemplateListQuerySchema = z.object({
  gymId: gymIdSchema.optional(),
});

export type WorkoutCardTemplateListQuery = z.infer<typeof workoutCardTemplateListQuerySchema>;
