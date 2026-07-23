import { z } from 'zod';

export const machineCoverListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  brandCode: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});

export const machineCoverUploadParamsSchema = z.object({
  machineCode: z.string().trim().min(1).max(80),
});
