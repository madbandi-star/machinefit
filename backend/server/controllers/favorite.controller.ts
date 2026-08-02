import type { Request, Response } from 'express';
import { z } from 'zod';
import { gymIdSchema, memberIdSchema } from '@machinefit/shared';
import { favoriteService } from '../services/favorite.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { getParam } from '../utils/params.util.js';

type FavoriteListQuery = { gymId: string; memberId?: string };
type FavoriteCheckQuery = { gymId: string; memberId?: string };

export async function listFavorites(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { gymId, memberId } = getValidatedQuery<FavoriteListQuery>(res);
  const locale = resolveRequestLocale(req);
  const items = await favoriteService.list(req.user.userId, gymId, locale, { memberId });
  res.json({ success: true, data: items });
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = z
    .object({
      gymId: gymIdSchema,
      memberId: memberIdSchema,
      machineCode: z.string().min(1),
      recommendationId: z.string().uuid().optional(),
    })
    .parse(req.body);
  const locale = resolveRequestLocale(req);
  const item = await favoriteService.add(
    req.user.userId,
    body.gymId,
    body.memberId,
    body.machineCode,
    body.recommendationId,
    locale
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const favoriteId = z.string().uuid().parse(getParam(req.params.id));
  await favoriteService.remove(req.user.userId, favoriteId);
  res.json({ success: true, data: { message: 'Removed' } });
}

export async function removeFavoritesBulk(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = z
    .object({
      ids: z.array(z.string().uuid()).min(1).max(200),
    })
    .parse(req.body);
  const data = await favoriteService.removeMany(req.user.userId, body.ids);
  res.json({ success: true, data });
}

export async function checkFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { gymId, memberId } = getValidatedQuery<FavoriteCheckQuery>(res);
  const result = await favoriteService.check(
    req.user.userId,
    gymId,
    getParam(req.params.machineCode),
    memberId
  );
  res.json({ success: true, data: result });
}
