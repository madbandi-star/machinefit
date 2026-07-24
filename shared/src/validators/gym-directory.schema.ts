import { z } from 'zod';

export const gymDirectorySearchSchema = z.object({
  q: z.string().trim().min(2).max(80),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  stateId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
  countryCode: z.string().length(2).optional(),
  /** Optional user/GPS coords — results sorted by Haversine distance when set. */
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  brand: z.string().trim().min(1).max(80).optional(),
});

export type GymDirectorySearchQuery = z.infer<typeof gymDirectorySearchSchema>;
