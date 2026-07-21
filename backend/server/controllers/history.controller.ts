import type { Request, Response } from 'express';
import { z } from 'zod';
import { gymScopeIdSchema, gymIdSchema, memberIdSchema } from '@machinefit/shared';
import { historyService } from '../services/history.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { getParam } from '../utils/params.util.js';

export async function listHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = z
    .object({
      gymId: gymScopeIdSchema,
      memberId: memberIdSchema.optional(),
      machineCode: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      from: z.string().datetime({ offset: true }).optional(),
      to: z.string().datetime({ offset: true }).optional(),
    })
    .parse(req.query);
  const locale = resolveRequestLocale(req);
  const items = await historyService.list(
    req.user.userId,
    {
      gymId: query.gymId,
      memberId: query.memberId,
      machineCode: query.machineCode,
      limit: query.limit,
      from: query.from,
      to: query.to,
    },
    locale
  );
  res.json({ success: true, data: items });
}

export async function recordHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = z
    .object({
      gymId: gymIdSchema,
      memberId: memberIdSchema,
      machineCode: z.string().min(1),
      recommendationId: z.string().uuid(),
    })
    .parse(req.body);
  await historyService.record(
    req.user.userId,
    body.gymId,
    body.memberId,
    body.machineCode,
    body.recommendationId
  );
  res.status(201).json({ success: true, data: { message: 'Recorded' } });
}

export async function clearHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = gymIdSchema.parse(req.query.gymId);
  await historyService.clear(req.user.userId, gymId);
  res.json({ success: true, data: { message: 'Cleared' } });
}

export async function removeHistoryItem(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await historyService.remove(req.user.userId, getParam(req.params.id));
  res.json({ success: true, data: { message: 'Removed' } });
}
