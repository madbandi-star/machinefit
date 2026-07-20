import { z } from 'zod';

const mediaSlotSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).default(''),
  mediaUrl: z.string().max(1000).default(''),
  sortOrder: z.number().int().min(0).max(4),
  isSelected: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const replaceMotivationMediaSchema = z.object({
  mediaType: z.enum(['music', 'video']),
  items: z
    .array(mediaSlotSchema)
    .max(5)
    .refine(
      (items) => new Set(items.map((i) => i.sortOrder)).size === items.length,
      'sortOrder values must be unique within a media type'
    ),
});

export type ReplaceMotivationMediaInput = z.infer<typeof replaceMotivationMediaSchema>;
export type MotivationMediaSlotInput = z.infer<typeof mediaSlotSchema>;
