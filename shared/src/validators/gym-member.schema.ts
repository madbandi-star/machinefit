import { z } from 'zod';

/** Accept YYYY-MM-DD or ISO timestamps from older clients / pg serialization. */
function dateOnlyPreprocess(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : value;
}

export const createGymMemberSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'other']).optional(),
  heightCm: z.coerce.number().min(100).max(250).optional(),
  weightKg: z.coerce.number().min(30).max(300).optional(),
  birthDate: z.preprocess(
    dateOnlyPreprocess,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal(''))
  ),
  memo: z.string().max(2000).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
});

export const updateGymMemberSchema = createGymMemberSchema.partial();

/** Accepts { status } (canonical) or legacy { action: 'approve' | 'deny' }. */
export const respondMemberProfileRequestSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const body = raw as Record<string, unknown>;
  if (typeof body.status === 'string') return { status: body.status };
  if (body.action === 'approve') return { status: 'approved' };
  if (body.action === 'deny') return { status: 'denied' };
  return body;
}, z.object({ status: z.enum(['approved', 'denied']) }));

export type CreateGymMemberInput = z.infer<typeof createGymMemberSchema>;
export type UpdateGymMemberInput = z.infer<typeof updateGymMemberSchema>;
export type RespondMemberProfileRequestInput = z.infer<
  typeof respondMemberProfileRequestSchema
>;
