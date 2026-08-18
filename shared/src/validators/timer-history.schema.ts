import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
]);
const uuid = z.string().uuid();

const exerciseSchema = z.object({
  workoutLogId: uuid.optional(),
  machineCode: z.string().trim().min(1).max(80).optional(),
  machineName: z.string().trim().max(200).optional(),
  recordedAt: isoDateTime.optional(),
});

const lapSchema = z.object({
  lapNumber: z.number().int().min(1).max(200),
  startedAt: isoDateTime,
  endedAt: isoDateTime,
  durationSeconds: z.number().int().min(0).max(86_400),
  exercises: z.array(exerciseSchema).max(40).optional(),
});

export const createTimerHistorySchema = z
  .object({
    clientSessionId: uuid,
    sessionDate: isoDate,
    startedAt: isoDateTime,
    endedAt: isoDateTime,
    durationSeconds: z.number().int().min(0).max(86_400),
    gymId: uuid.optional(),
    memberId: uuid.optional(),
    laps: z.array(lapSchema).min(1).max(200),
  })
  .superRefine((value, ctx) => {
    if (Date.parse(value.endedAt) < Date.parse(value.startedAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endedAt must be on or after startedAt',
        path: ['endedAt'],
      });
    }
  });

export const timerHistoryMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const timerHistoryDateParamsSchema = z.object({
  date: isoDate,
});

export const timerHistorySessionParamsSchema = z.object({
  sessionId: uuid,
});

export type CreateTimerHistoryInput = z.infer<typeof createTimerHistorySchema>;
export type TimerHistoryMonthQuery = z.infer<typeof timerHistoryMonthQuerySchema>;
