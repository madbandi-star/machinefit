import type { Request, Response } from 'express';
import { z } from 'zod';
import { liveDashboardService } from '../services/live-dashboard.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const snapshotSchema = z.object({
  level: z.enum(['world', 'country', 'metro', 'district', 'gym', 'user']).default('world'),
  countryCode: z.string().length(2).optional(),
  metroCode: z.string().max(40).optional(),
  districtCode: z.string().max(40).optional(),
  gymId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

const rankingSchema = z.object({
  board: z
    .enum(['country', 'metro', 'district', 'gym', 'member', 'brand', 'machine', 'muscle'])
    .default('metro'),
  period: z.enum(['today', 'week', 'month', 'year', 'all']).default('today'),
  countryCode: z.string().length(2).optional(),
  metroCode: z.string().max(40).optional(),
  districtCode: z.string().max(40).optional(),
  gymId: z.string().uuid().optional(),
});

export async function getLiveSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = snapshotSchema.parse(req.query);
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await liveDashboardService.getSnapshot({
    level: query.level,
    scope: {
      countryCode: query.countryCode,
      metroCode: query.metroCode,
      districtCode: query.districtCode,
      gymId: query.gymId,
      userId: query.userId,
    },
    locale,
    viewerUserId: req.user.userId,
  });
  res.json({ success: true, data });
}

export async function getLiveRankings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = rankingSchema.parse(req.query);
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await liveDashboardService.getRankings({
    board: query.board,
    period: query.period,
    scope: {
      countryCode: query.countryCode,
      metroCode: query.metroCode,
      districtCode: query.districtCode,
      gymId: query.gymId,
    },
    locale,
    viewerUserId: req.user.userId,
  });
  res.json({ success: true, data });
}

export async function searchLive(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const q = String(req.query.q ?? '');
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await liveDashboardService.search(q, locale);
  res.json({ success: true, data });
}
