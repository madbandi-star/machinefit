import { z } from 'zod';

export const createUserGymSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  brandName: z.string().max(100).optional().or(z.literal('')),
  setActive: z.boolean().optional().default(true),
  setDefault: z.boolean().optional().default(false),
});

export const updateUserGymSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional().nullable().or(z.literal('')),
  brandName: z.string().max(100).optional().nullable().or(z.literal('')),
  isDefault: z.boolean().optional(),
});

export type CreateUserGymInput = z.infer<typeof createUserGymSchema>;
export type UpdateUserGymInput = z.infer<typeof updateUserGymSchema>;
