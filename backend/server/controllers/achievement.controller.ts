import type { Request, Response } from 'express';
import { z } from 'zod';
import { achievementService } from '../services/achievement.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const rankingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function getAchievementSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await achievementService.getSnapshot(req.user.userId);
  res.json({ success: true, data });
}

export async function getAchievementRankings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = rankingQuerySchema.parse(req.query);
  const data = await achievementService.getRankings(req.user.userId, query.limit);
  res.json({ success: true, data });
}
