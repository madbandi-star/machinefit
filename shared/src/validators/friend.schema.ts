import { z } from 'zod';
import {
  FRIEND_RANKING_METRICS,
  FRIEND_SORTS,
  PRIVACY_LEVELS,
} from '../types/friend.types.js';

const privacy = z.enum(PRIVACY_LEVELS);

export const listFriendsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  sort: z.enum(FRIEND_SORTS).optional().default('name'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const searchUsersForFriendSchema = z.object({
  q: z.string().trim().min(1).max(80),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(20),
});

export const createFriendRequestSchema = z.object({
  toUserId: z.string().uuid(),
  message: z.string().trim().max(300).optional().default(''),
});

export const updateFriendPrivacySchema = z.object({
  profileVisibility: privacy.optional(),
  workoutRecordsVisibility: privacy.optional(),
  workoutReportVisibility: privacy.optional(),
  growthVisibility: privacy.optional(),
  badgesVisibility: privacy.optional(),
  achievementsVisibility: privacy.optional(),
  gymVisibility: privacy.optional(),
  onlineStatusVisibility: privacy.optional(),
  bio: z.string().trim().max(1000).optional(),
  careerText: z.string().trim().max(2000).optional(),
  favoriteMuscleGroup: z.string().trim().max(80).optional().nullable(),
  favoriteMachineCode: z.string().trim().max(80).optional().nullable(),
});

export const listFriendFeedSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const listFriendRankingsSchema = z.object({
  metric: z.enum(FRIEND_RANKING_METRICS),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createFriendReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.enum(['spam', 'abuse', 'fake', 'other']),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const resolveFriendReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
});
