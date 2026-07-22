import { z } from 'zod';

export const MOTIVATION_AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav', 'ogg'] as const;

export const createMotivationTrackFromUrlSchema = z.object({
  title: z.string().trim().min(1).max(200),
  mediaUrl: z.string().trim().url().max(2000),
  durationSeconds: z.number().finite().nonnegative().max(86_400).optional().nullable(),
  setAsDefault: z.boolean().optional().default(false),
});

export const updateMotivationTrackSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    isDefault: z.boolean().optional(),
    durationSeconds: z.number().finite().nonnegative().max(86_400).optional().nullable(),
  })
  .refine((value) => value.title !== undefined || value.isDefault !== undefined || value.durationSeconds !== undefined, {
    message: 'At least one field is required',
  });

export type CreateMotivationTrackFromUrlInput = z.infer<typeof createMotivationTrackFromUrlSchema>;
export type UpdateMotivationTrackInput = z.infer<typeof updateMotivationTrackSchema>;
