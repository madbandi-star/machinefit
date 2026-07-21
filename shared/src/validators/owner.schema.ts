import { z } from 'zod';

export const createMachineRequestSchema = z.object({
  brandName: z.string().max(100).optional(),
  machineName: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

/** Owner verification application. Payment integration will set paymentStatus=paid. */
export const ownerApplicationSchema = z.object({
  businessName: z.string().min(2).max(200),
  applicantName: z.string().min(1).max(100),
  businessPhone: z.string().min(3).max(30),
  businessEmail: z.string().email(),
  description: z.string().max(2000).optional(),
  evidenceUrl: z.string().url().max(500).optional().or(z.literal('')),
  gymId: z.string().uuid().optional(),
  /**
   * Stub for future billing. When OWNER_APPLY_REQUIRE_PAYMENT=true on server,
   * only paymentStatus=paid (with paymentReference) is accepted.
   * Default client value is waived until checkout exists.
   */
  paymentStatus: z.enum(['pending', 'paid', 'waived']).default('waived'),
  paymentReference: z.string().max(100).optional(),
});

export const reviewOwnerApplicationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminNote: z.string().max(2000).optional(),
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
  quantity: z.number().int().min(1).max(99).default(1),
  notes: z.string().max(500).optional(),
  floorZone: z.string().max(50).optional(),
});

export const adminGymMachineActionSchema = z.object({
  action: z.enum(['restore', 'force_delete']),
});

export type CreateMachineRequestInput = z.infer<typeof createMachineRequestSchema>;
export type OwnerApplicationInput = z.infer<typeof ownerApplicationSchema>;
export type ReviewOwnerApplicationInput = z.infer<typeof reviewOwnerApplicationSchema>;
export type CreateOwnerGymInput = z.infer<typeof createOwnerGymSchema>;
export type AddGymMachineInput = z.infer<typeof addGymMachineSchema>;
export type AdminGymMachineActionInput = z.infer<typeof adminGymMachineActionSchema>;
