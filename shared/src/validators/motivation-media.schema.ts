import { z } from 'zod';
import {
  MOTIVATION_MEDIA_MAX_SLOTS,
  MOTIVATION_MEDIA_MAX_SORT_ORDER,
} from '../constants/motivation-media.js';

const mediaSlotSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).default(''),
  mediaUrl: z.string().max(1000).default(''),
  coverImageUrl: z.string().max(1000).optional().nullable().default(null),
  sortOrder: z.number().int().min(0).max(MOTIVATION_MEDIA_MAX_SORT_ORDER),
  isSelected: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const replaceMotivationMediaSchema = z.object({
  mediaType: z.enum(['music', 'video']),
  items: z
    .array(mediaSlotSchema)
    .max(MOTIVATION_MEDIA_MAX_SLOTS)
    .refine(
      (items) => new Set(items.map((i) => i.sortOrder)).size === items.length,
      'sortOrder values must be unique within a media type'
    ),
});

export type ReplaceMotivationMediaInput = z.infer<typeof replaceMotivationMediaSchema>;
export type MotivationMediaSlotInput = z.infer<typeof mediaSlotSchema>;
