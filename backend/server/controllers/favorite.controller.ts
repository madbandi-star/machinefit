import type { Request, Response } from 'express';
import { favoriteService } from '../services/favorite.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listFavorites(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const items = await favoriteService.list(req.user.userId);
  res.json({ success: true, data: items });
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const { machineCode, recommendationId } = req.body as {
    machineCode: string;
    recommendationId?: string;
  };
  if (!machineCode) throw new AppError(400, 'VALIDATION_ERROR', 'machineCode required');
  const item = await favoriteService.add(req.user.userId, machineCode, recommendationId);
  res.status(201).json({ success: true, data: item });
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await favoriteService.remove(req.user.userId, getParam(req.params.id));
  res.json({ success: true, data: { message: 'Removed' } });
}

export async function checkFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const result = await favoriteService.check(
    req.user.userId,
    getParam(req.params.machineCode)
  );
  res.json({ success: true, data: result });
}
