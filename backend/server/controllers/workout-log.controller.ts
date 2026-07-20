import type { Request, Response } from 'express';
import { upsertWorkoutLogSchema, workoutLogListQuerySchema, workoutInsightsQuerySchema, deleteWorkoutLogSchema } from '@machinefit/shared';
import { workoutLogService } from '../services/workout-log.service.js';
import { workoutInsightsService } from '../services/workout-insights.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';

export async function getWorkoutInsights(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = workoutInsightsQuerySchema.parse(req.query);
  const data = await workoutInsightsService.getInsights(req.user.userId, query);
  res.json({ success: true, data });
}

export async function listWorkoutLogs(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = workoutLogListQuerySchema.parse(req.query);
  const locale = resolveRequestLocale(req);
  const items = await workoutLogService.list(req.user.userId, query, locale);
  res.json({ success: true, data: items });
}

export async function upsertWorkoutLog(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = upsertWorkoutLogSchema.parse(req.body);
  const item = await workoutLogService.upsert(req.user.userId, body);
  res.json({ success: true, data: item });
}

export async function deleteWorkoutLog(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = deleteWorkoutLogSchema.parse(req.body);
  await workoutLogService.remove(req.user.userId, body);
  res.json({ success: true, data: { message: 'Deleted' } });
}
