import type { Request, Response } from 'express';
import { z } from 'zod';
import { historyListQuerySchema } from '@machinefit/shared';
import { historyService } from '../services/history.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { getParam } from '../utils/params.util.js';

export async function listHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = historyListQuerySchema.parse(req.query);
  const locale = resolveRequestLocale(req);
  const items = await historyService.list(
    req.user.userId,
    {
      gymId: query.gymId,
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
      gymId: z.string().uuid(),
      machineCode: z.string().min(1),
      recommendationId: z.string().uuid(),
    })
    .parse(req.body);
  await historyService.record(
    req.user.userId,
    body.gymId,
    body.machineCode,
    body.recommendationId
  );
  res.status(201).json({ success: true, data: { message: 'Recorded' } });
}

export async function clearHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = z.string().uuid().parse(req.query.gymId);
  await historyService.clear(req.user.userId, gymId);
  res.json({ success: true, data: { message: 'Cleared' } });
}

export async function removeHistoryItem(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await historyService.remove(req.user.userId, getParam(req.params.id));
  res.json({ success: true, data: { message: 'Removed' } });
}
