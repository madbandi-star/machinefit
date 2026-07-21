import { z } from 'zod';

export const createGymMemberSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  weightKg: z.number().min(30).max(300).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  memo: z.string().max(2000).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});

export const updateGymMemberSchema = createGymMemberSchema.partial();

export const respondMemberProfileRequestSchema = z.object({
  status: z.enum(['approved', 'denied']),
});

export type CreateGymMemberInput = z.infer<typeof createGymMemberSchema>;
export type UpdateGymMemberInput = z.infer<typeof updateGymMemberSchema>;
export type RespondMemberProfileRequestInput = z.infer<typeof respondMemberProfileRequestSchema>;
