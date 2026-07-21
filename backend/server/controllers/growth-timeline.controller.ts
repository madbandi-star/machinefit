import type { Request, Response } from 'express';
import { growthTimelineService } from '../services/growth-timeline.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getGrowthTimelineSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await growthTimelineService.getSnapshot(req.user.userId, locale);
  res.json({ success: true, data });
}
