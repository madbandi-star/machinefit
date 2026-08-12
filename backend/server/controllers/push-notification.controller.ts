import type { Request, Response } from 'express';
import { pushAudiencePreviewSchema, pushSendSchema } from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { pushNotificationService } from '../services/push-notification.service.js';
import { getParam } from '../utils/params.util.js';

function requireUser(req: Request): {
  userId: string;
  roleCode: NonNullable<Request['user']>['roleCode'];
} {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return { userId: req.user.userId, roleCode: req.user.roleCode };
}

export async function getCapabilities(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const data = await pushNotificationService.getCapabilities(userId, roleCode);
  res.json({ success: true, data });
}

export async function previewAudience(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const input = pushAudiencePreviewSchema.parse(req.body);
  const data = await pushNotificationService.previewAudience(userId, input, roleCode);
  res.json({ success: true, data });
}

export async function sendPush(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const input = pushSendSchema.parse(req.body);
  const data = await pushNotificationService.send(userId, input, roleCode);
  res.status(201).json({ success: true, data });
}

export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const all = req.query.all === '1' || req.query.all === 'true';
  const limit = parseInt(String(req.query.limit ?? '50'), 10);
  const offset = parseInt(String(req.query.offset ?? '0'), 10);
  const data = await pushNotificationService.listCampaigns(
    userId,
    {
      all,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    },
    roleCode
  );
  res.json({ success: true, data });
}

export async function listCampaignLogs(req: Request, res: Response): Promise<void> {
  const { userId, roleCode } = requireUser(req);
  const data = await pushNotificationService.listCampaignLogs(
    userId,
    getParam(req.params.id),
    roleCode
  );
  res.json({ success: true, data });
}
