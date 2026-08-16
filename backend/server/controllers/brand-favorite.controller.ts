import type { Request, Response } from 'express';
import { z } from 'zod';
import { brandFavoriteService } from '../services/brand-favorite.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listBrandFavorites(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const items = await brandFavoriteService.list(req.user.userId);
  res.json({ success: true, data: items });
}

export async function listBrandFavoriteIds(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const ids = await brandFavoriteService.listIds(req.user.userId);
  res.json({ success: true, data: { brandIds: ids } });
}

export async function addBrandFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const brandId = z.string().uuid().parse(getParam(req.params.brandId));
  const item = await brandFavoriteService.add(req.user.userId, brandId);
  res.status(201).json({ success: true, data: item });
}

export async function removeBrandFavorite(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const brandId = z.string().uuid().parse(getParam(req.params.brandId));
  const data = await brandFavoriteService.remove(req.user.userId, brandId);
  res.json({ success: true, data });
}
