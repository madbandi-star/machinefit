import { z } from 'zod';

export const createMachineRequestSchema = z.object({
  brandName: z.string().max(100).optional(),
  machineName: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const ownerApplicationSchema = z.object({
  businessName: z.string().min(2).max(200),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().max(30).optional(),
  description: z.string().max(1000).optional(),
});

export const createOwnerGymSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  address: z.string().min(5),
  city: z.string().max(100).optional(),
  countryCode: z.string().length(2).default('KR'),
  phone: z.string().max(30).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const addGymMachineSchema = z.object({
  machineCode: z.string().min(1).max(80),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().max(500).optional(),
  floorZone: z.string().max(50).optional(),
});

export type CreateMachineRequestInput = z.infer<typeof createMachineRequestSchema>;
export type OwnerApplicationInput = z.infer<typeof ownerApplicationSchema>;
export type CreateOwnerGymInput = z.infer<typeof createOwnerGymSchema>;
export type AddGymMachineInput = z.infer<typeof addGymMachineSchema>;
