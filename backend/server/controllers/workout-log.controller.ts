import type { Request, Response } from 'express';
import type {
  DeleteWorkoutLogInput,
  DeleteWorkoutLogsByDateBody,
  ReorderWorkoutRecordCardsInput,
  UpsertWorkoutLogInput,
} from '@machinefit/shared';
import { workoutLogService } from '../services/workout-log.service.js';
import { workoutInsightsService } from '../services/workout-insights.service.js';
import { workoutRecordOrderService } from '../services/workout-record-order.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { resolveRequestLocale } from '../utils/locale.util.js';

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export async function getWorkoutInsights(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutInsightsService.getInsights>[1]>(res);
  const data = await workoutInsightsService.getInsights(req.user.userId, query);
  res.json({ success: true, data });
}

export async function listWorkoutLogs(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutLogService.list>[1]>(res);
  const locale = resolveRequestLocale(req);
  const items = await workoutLogService.list(req.user.userId, query, locale);
  res.json({ success: true, data: items });
}

export async function upsertWorkoutLog(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  // Body already validated by validateBody(upsertWorkoutLogSchema) middleware.
  const body = req.body as UpsertWorkoutLogInput;
  const locale = resolveRequestLocale(req);
  const item = await workoutLogService.upsert(req.user.userId, body, locale);
  res.json({ success: true, data: item });
}

export async function deleteWorkoutLog(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  // Body already validated by validateBody(deleteWorkoutLogSchema) middleware.
  const body = req.body as DeleteWorkoutLogInput;
  await workoutLogService.remove(req.user.userId, body);
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function deleteWorkoutLogsByDate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const logDate = getParam(req.params.date);
  const body = req.body as DeleteWorkoutLogsByDateBody;
  const data = await workoutLogService.removeByDate(req.user.userId, logDate, body);
  res.json({
    success: true,
    data: { message: 'Deleted', ...data },
  });
}

export async function listWorkoutRecordDisplayOrders(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<Parameters<typeof workoutRecordOrderService.list>[1]>(res);
  const data = await workoutRecordOrderService.list(req.user.userId, query);
  res.json({ success: true, data });
}

export async function reorderWorkoutRecordCards(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as ReorderWorkoutRecordCardsInput;
  const data = await workoutRecordOrderService.reorder(req.user.userId, body);
  res.json({ success: true, data });
}
