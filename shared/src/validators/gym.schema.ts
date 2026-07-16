import { z } from 'zod';

export const gymListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  countryId: z.string().uuid().optional(),
  city: z.string().optional(),
  machineCode: z.string().optional(),
  brandCode: z.string().optional(),
  q: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(100).default(10),
});

export type GymListQuery = z.infer<typeof gymListQuerySchema>;
