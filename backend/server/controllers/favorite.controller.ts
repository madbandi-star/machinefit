import type { Request, Response } from 'express';
import { z } from 'zod';
import { favoriteService } from '../services/favorite.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { getParam } from '../utils/params.util.js';

const gymIdSchema = z.string().uuid();

export async function listFavorites(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = gymIdSchema.parse(req.query.gymId);
  const locale = resolveRequestLocale(req);
  const items = await favoriteService.list(req.user.userId, gymId, locale);
  res.json({ success: true, data: items });
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = z
    .object({
      gymId: z.string().uuid(),
      machineCode: z.string().min(1),
      recommendationId: z.string().uuid().optional(),
    })
    .parse(req.body);
  const locale = resolveRequestLocale(req);
  const item = await favoriteService.add(
    req.user.userId,
    body.gymId,
    body.machineCode,
    body.recommendationId,
    locale
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await favoriteService.remove(req.user.userId, getParam(req.params.id));
  res.json({ success: true, data: { message: 'Removed' } });
}

export async function checkFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gymId = gymIdSchema.parse(req.query.gymId);
  const result = await favoriteService.check(
    req.user.userId,
    gymId,
    getParam(req.params.machineCode)
  );
  res.json({ success: true, data: result });
}
