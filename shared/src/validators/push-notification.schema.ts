import { z } from 'zod';
import { isRoleCode } from '../constants/roles.js';
import type { RoleCode } from '../types/api.types.js';
import { PUSH_AUDIENCE_TYPES, PUSH_KINDS } from '../types/push-notification.types.js';

const roleCodeSchema = z.custom<RoleCode>((value) => isRoleCode(value), {
  message: 'Invalid roleCode',
});

export const pushAudienceSchema = z.object({
  type: z.enum(PUSH_AUDIENCE_TYPES),
  roleCode: roleCodeSchema.optional(),
  gymId: z.string().uuid().optional(),
  countryCode: z.string().trim().max(8).optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  userIds: z.array(z.string().uuid()).max(500).optional(),
  query: z.string().trim().min(1).max(120).optional(),
});

export const pushSendSchema = z.object({
  kind: z.enum(PUSH_KINDS),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  imageUrl: z.string().trim().url().max(1000).optional().nullable(),
  deepLink: z.string().trim().max(500).optional().nullable(),
  audience: pushAudienceSchema,
});

export type PushSendSchemaInput = z.infer<typeof pushSendSchema>;
