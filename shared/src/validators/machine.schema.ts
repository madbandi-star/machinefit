import { z } from 'zod';

export const machineListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brandCode: z.string().optional(),
  muscleGroup: z.string().optional(),
  machineType: z.string().optional(),
  q: z.string().optional(),
});

export type MachineListQuery = z.infer<typeof machineListQuerySchema>;

export const historyListQuerySchema = z.object({
  machineCode: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type HistoryListQuery = z.infer<typeof historyListQuerySchema>;
