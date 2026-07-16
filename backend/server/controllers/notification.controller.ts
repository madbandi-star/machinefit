import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const page = parseInt(String(req.query.page ?? '1'), 10);
  const limit = parseInt(String(req.query.limit ?? '20'), 10);
  const result = await notificationService.list(req.user.userId, page, limit);
  res.json({ success: true, data: result });
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const count = await notificationService.unreadCount(req.user.userId);
  res.json({ success: true, data: { count } });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await notificationService.markRead(req.user.userId, getParam(req.params.id));
  res.json({ success: true, data: { message: 'Marked as read' } });
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const count = await notificationService.markAllRead(req.user.userId);
  res.json({ success: true, data: { count } });
}
