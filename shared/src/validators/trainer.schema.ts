import { z } from 'zod';

export const trainerApplicationSchema = z.object({
  applicantName: z.string().min(1).max(100),
  phone: z.string().min(3).max(30),
  email: z.string().email().max(255),
  specialties: z.string().max(500).optional(),
  career: z.string().max(2000).optional(),
  certifications: z.string().max(500).optional(),
  message: z.string().max(2000).optional(),
});

export const reviewTrainerApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().max(2000).optional(),
});

export type TrainerApplicationInput = z.infer<typeof trainerApplicationSchema>;
export type ReviewTrainerApplicationInput = z.infer<typeof reviewTrainerApplicationSchema>;
