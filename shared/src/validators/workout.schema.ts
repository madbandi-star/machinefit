import { z } from 'zod';
import { TARGET_MUSCLE_GROUPS } from '../constants/workout-goals.js';
import { getUtf8ByteLength, WORKOUT_DIARY_MAX_BYTES } from '../utils/utf8-bytes.js';

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

export const workoutLogListQuerySchema = z.object({
  gymId: z.string().uuid(),
  machineCode: z.string().min(1).optional(),
  logDate: dateKeySchema.optional(),
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
});

export type WorkoutLogListQuery = z.infer<typeof workoutLogListQuerySchema>;

export const upsertWorkoutLogSchema = z
  .object({
    gymId: z.string().uuid(),
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
  gymId: z.string().uuid(),
  machineCode: z.string().min(1),
  logDate: dateKeySchema,
  targetMuscleGroup: z.enum(TARGET_MUSCLE_GROUPS).optional(),
});

export type DeleteWorkoutLogInput = z.infer<typeof deleteWorkoutLogSchema>;

export const workoutInsightPeriodSchema = z.enum(['30d', '3m', 'all']);

export const workoutInsightsQuerySchema = z
  .object({
    gymId: z.string().uuid(),
    viewMode: z.enum(['machine', 'daily']).default('machine'),
    machineCode: z.string().min(1).optional(),
    period: workoutInsightPeriodSchema.optional().default('30d'),
  })
  .refine((value) => value.viewMode !== 'machine' || Boolean(value.machineCode), {
    message: 'machineCode is required for machine insights',
    path: ['machineCode'],
  });

export type WorkoutInsightsQuery = z.infer<typeof workoutInsightsQuerySchema>;
