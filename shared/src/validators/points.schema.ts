import { z } from 'zod';
import { POINT_ACTION_CODES, POINT_CLIENT_TRACKABLE_ACTIONS } from '../constants/points.js';

export const pointClientTrackSchema = z.object({
  actionCode: z.enum(POINT_CLIENT_TRACKABLE_ACTIONS),
  referenceType: z.string().max(80).optional(),
  referenceId: z.string().max(120).optional(),
});

export const pointPolicyUpdateSchema = z.object({
  actionName: z.string().min(1).max(160).optional(),
  points: z.number().int().min(0).max(1_000_000).optional(),
  dailyLimit: z.number().int().min(0).nullable().optional(),
  userLimit: z.number().int().min(0).nullable().optional(),
  cooldownSeconds: z.number().int().min(0).max(86400).optional(),
  enabled: z.boolean().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  description: z.string().max(2000).optional(),
});

export const adminPointAdjustSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int().min(1).max(1_000_000),
  direction: z.enum(['grant', 'deduct']),
  description: z.string().min(1).max(500),
});

export const pointLedgerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type PointClientTrackInput = z.infer<typeof pointClientTrackSchema>;
export type PointPolicyUpdateInput = z.infer<typeof pointPolicyUpdateSchema>;
export type AdminPointAdjustInput = z.infer<typeof adminPointAdjustSchema>;

/** Ensure action codes stay in sync for tooling. */
export const pointActionCodeSchema = z.enum(POINT_ACTION_CODES);
