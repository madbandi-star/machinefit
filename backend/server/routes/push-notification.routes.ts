import { Router } from 'express';
import { Role } from '@machinefit/shared';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { pushSendRateLimit } from '../middlewares/rate-limit.middleware.js';
import * as pushNotificationController from '../controllers/push-notification.controller.js';

export const pushNotificationRouter = Router();

pushNotificationRouter.use(authMiddleware, requireMinRole(Role.MEMBER));

pushNotificationRouter.get('/capabilities', pushNotificationController.getCapabilities);
pushNotificationRouter.post(
  '/audience-preview',
  pushNotificationController.previewAudience
);
pushNotificationRouter.post(
  '/send',
  pushSendRateLimit,
  idempotencyMiddleware(180_000),
  pushNotificationController.sendPush
);
pushNotificationRouter.get('/campaigns', pushNotificationController.listCampaigns);
pushNotificationRouter.get(
  '/campaigns/:id/logs',
  pushNotificationController.listCampaignLogs
);
