import type { Request, Response } from 'express';
import { z } from 'zod';
import { gymIdSchema, memberIdSchema } from '@machinefit/shared';
import { achievementService } from '../services/achievement.service.js';
import { AppError } from '../middlewares/error.middleware.js';

const rankingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const scopeQuerySchema = z
  .object({
    gymId: gymIdSchema.optional(),
    memberId: memberIdSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.gymId && !value.memberId) || (!value.gymId && value.memberId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'gymId and memberId must be provided together',
        path: value.gymId ? ['memberId'] : ['gymId'],
      });
    }
  });

export async function getAchievementSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const scope = scopeQuerySchema.parse(req.query);
  const data = await achievementService.getSnapshot(req.user.userId, scope);
  res.json({ success: true, data });
}

export async function getAchievementRankings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = rankingQuerySchema.parse(req.query);
  const data = await achievementService.getRankings(req.user.userId, query.limit);
  res.json({ success: true, data });
}

const acknowledgeBodySchema = z.object({
  achievementIds: z.array(z.string().min(1)).optional(),
});

export async function acknowledgeAchievementUnlocks(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = acknowledgeBodySchema.parse(req.body ?? {});
  await achievementService.acknowledgeUnlocks(req.user.userId, body.achievementIds);
  res.json({ success: true, data: { message: 'Acknowledged' } });
}
