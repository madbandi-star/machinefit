import type { Request, Response } from 'express';
import { z } from 'zod';
import { gymIdSchema, memberIdSchema } from '@machinefit/shared';
import { lifterDnaService } from '../services/lifter-dna.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const scopeQuerySchema = z
  .object({
    gymId: gymIdSchema.optional(),
    memberId: memberIdSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.gymId && !value.memberId) || (!value.gymId && value.memberId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'gymId and memberId must be provided together',
        path: value.gymId ? ['memberId'] : ['gymId'],
      });
    }
  });

export async function getLifterDnaSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const scope = scopeQuerySchema.parse(req.query);
  const data = await lifterDnaService.getSnapshot(req.user.userId, locale, scope);
  res.json({ success: true, data });
}
