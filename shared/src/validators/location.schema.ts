import { z } from 'zod';

export const locationVisibilitySchema = z.enum(['hidden', 'country', 'city', 'gym']);

export const locationInputSchema = z.object({
  countryCode: z.string().length(2).optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  cityId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  districtName: z.string().max(120).optional().nullable().or(z.literal('')),
  postalCode: z.string().max(32).optional().nullable().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const userLocationUpsertSchema = locationInputSchema.extend({
  visibility: locationVisibilitySchema.optional().default('gym'),
});

export const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const adminLocationCountrySchema = z.object({
  code: z.string().length(2),
  name: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
  flagEmoji: z.string().max(8).optional(),
  defaultTimezone: z.string().min(1).max(50).default('UTC'),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const adminLocationStateSchema = z.object({
  countryCode: z.string().length(2),
  code: z.string().min(1).max(40),
  name: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const adminLocationCitySchema = z.object({
  stateId: z.string().uuid(),
  code: z.string().min(1).max(40),
  name: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export const adminLocationDistrictSchema = z.object({
  cityId: z.string().uuid(),
  code: z.string().min(1).max(40),
  name: z.object({ ko: z.string().min(1), en: z.string().min(1) }),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
});

export type LocationInput = z.infer<typeof locationInputSchema>;
export type UserLocationUpsertInput = z.infer<typeof userLocationUpsertSchema>;
