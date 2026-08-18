import type { Request, Response } from 'express';
import type { CreateTimerHistoryInput } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { getValidatedQuery } from '../middlewares/validate.middleware.js';
import { timerHistoryService } from '../services/timer-history.service.js';
import { resolveRequestLocale } from '../utils/locale.util.js';

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export async function createTimerHistory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = req.body as CreateTimerHistoryInput;
  const locale = resolveRequestLocale(req);
  try {
    const data = await timerHistoryService.create(req.user.userId, body, locale);
    res.status(data.duplicate ? 200 : 201).json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to save timer history');
  }
}

export async function getTimerHistoryMonth(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = getValidatedQuery<{ year: number; month: number }>(res);
  const data = await timerHistoryService.getMonth(req.user.userId, query.year, query.month);
  res.json({ success: true, data });
}

export async function getTimerHistoryDate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const date = getParam(req.params.date);
  const data = await timerHistoryService.getDate(req.user.userId, date);
  res.json({ success: true, data });
}

export async function getTimerHistorySession(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const sessionId = getParam(req.params.sessionId);
  const locale = resolveRequestLocale(req);
  const data = await timerHistoryService.getSession(req.user.userId, sessionId, locale);
  res.json({ success: true, data });
}
