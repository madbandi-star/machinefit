import type { Request, Response } from 'express';
import { z } from 'zod';
import { liftedVolumeService } from '../services/lifted-volume.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const snapshotQuerySchema = z.object({
  mode: z.enum(['global', 'gym', 'user']).default('user'),
  gymId: z.string().uuid().optional(),
});

const rankingQuerySchema = z.object({
  board: z.enum(['global', 'gym', 'friends', 'month', 'year']).default('global'),
  gymId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function getLiftedSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = snapshotQuerySchema.parse(req.query);
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await liftedVolumeService.getSnapshot({
    userId: req.user.userId,
    mode: query.mode,
    gymId: query.gymId,
    locale,
  });
  res.json({ success: true, data });
}

export async function getLiftedRankings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = rankingQuerySchema.parse(req.query);
  const data = await liftedVolumeService.getRankings({
    userId: req.user.userId,
    board: query.board,
    gymId: query.gymId,
    limit: query.limit,
  });
  res.json({ success: true, data });
}
