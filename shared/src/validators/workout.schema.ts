import { z } from 'zod';
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
  machineCode: z.string().min(1),
  logDate: dateKeySchema.optional(),
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
});

export type WorkoutLogListQuery = z.infer<typeof workoutLogListQuerySchema>;

export const upsertWorkoutLogSchema = z
  .object({
    machineCode: z.string().min(1),
    recommendationId: z.string().uuid().optional(),
    logDate: dateKeySchema.optional(),
    setCount: z.number().int().min(1).max(20),
    setWeightsKg: z.array(z.number().min(0).max(999)).min(1).max(20),
    diary: diarySchema,
  })
  .refine((data) => data.setWeightsKg.length === data.setCount, {
    message: 'setWeightsKg length must match setCount',
    path: ['setWeightsKg'],
  });

export type UpsertWorkoutLogInput = z.infer<typeof upsertWorkoutLogSchema>;
