import type { Request, Response } from 'express';
import { z } from 'zod';
import { gymScopeIdSchema, memberIdSchema } from '@machinefit/shared';
import { homeBootstrapService } from '../services/home-bootstrap.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';

export async function getHomeBootstrap(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  const query = z
    .object({
      gymId: gymScopeIdSchema.optional(),
      memberId: memberIdSchema.optional(),
      /** Comma list: todayCards,missed — optional extras; default payload unchanged. */
      include: z.string().max(80).optional(),
    })
    .parse(req.query);

  const locale = resolveRequestLocale(req);
  const data = await homeBootstrapService.get(req.user.userId, query, locale);
  res.json({ success: true, data });
}
