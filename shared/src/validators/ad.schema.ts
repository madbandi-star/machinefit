import { z } from 'zod';
import { AD_TRACK_EVENT_TYPES } from '../constants/ads.js';

export const adDecisionQuerySchema = z.object({
  placement: z.string().trim().min(1).max(64),
  event: z.string().trim().min(1).max(64).optional(),
  sessionId: z.string().trim().max(128).optional(),
  eventCount: z.coerce.number().int().min(0).max(100_000).optional(),
});
export type AdDecisionQuery = z.infer<typeof adDecisionQuerySchema>;

export const adTrackEventBodySchema = z.object({
  type: z.enum(AD_TRACK_EVENT_TYPES),
  placement: z.string().trim().min(1).max(64),
  event: z.string().trim().max(64).optional(),
  sessionId: z.string().trim().max(128).optional(),
  provider: z.string().trim().max(64).optional(),
  adType: z.string().trim().max(32).optional(),
});
export type AdTrackEventBody = z.infer<typeof adTrackEventBodySchema>;

export const adRewardClaimBodySchema = z.object({
  placement: z.string().trim().min(1).max(64).default('LIMIT_REACHED'),
  sessionId: z.string().trim().max(128).optional(),
  provider: z.string().trim().max(64).optional(),
});
export type AdRewardClaimBody = z.infer<typeof adRewardClaimBodySchema>;

export const adFlagUpdateSchema = z.object({
  enabled: z.boolean(),
});
export type AdFlagUpdate = z.infer<typeof adFlagUpdateSchema>;

export const adPlacementUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  priority: z.coerce.number().int().min(0).max(10_000).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});
export type AdPlacementUpdate = z.infer<typeof adPlacementUpdateSchema>;

export const adPolicyUpdateSchema = z.object({
  minIntervalSeconds: z.coerce.number().int().min(0).max(86_400).optional(),
  sessionLimit: z.coerce.number().int().min(0).max(10_000).nullable().optional(),
  dailyLimit: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
  eventIntervalCount: z.coerce.number().int().min(0).max(10_000).nullable().optional(),
  anonymousEnabled: z.boolean().optional(),
  freeUserEnabled: z.boolean().optional(),
  paidUserEnabled: z.boolean().optional(),
  adminEnabled: z.boolean().optional(),
  requireMarketingOptIn: z.boolean().optional(),
  enabled: z.boolean().optional(),
});
export type AdPolicyUpdate = z.infer<typeof adPolicyUpdateSchema>;

export const adStatsQuerySchema = z.object({
  range: z.enum(['today', 'yesterday', '7d', '30d']).default('today'),
});
export type AdStatsQuery = z.infer<typeof adStatsQuerySchema>;
