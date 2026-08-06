import { Router } from 'express';
import {
  createNoticeSchema,
  noticeFlagBodySchema,
  noticeIdParamsSchema,
  noticeListQuerySchema,
  noticePublishBodySchema,
  updateNoticeSchema,
} from '@machinefit/shared';
import * as noticeController from '../controllers/notice.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { Role } from '@machinefit/shared';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';
import { noticeAttachmentUpload } from '../middlewares/upload.middleware.js';

export const noticeRouter = Router();

noticeRouter.get(
  '/',
  optionalAuthMiddleware,
  validateQuery(noticeListQuerySchema),
  noticeController.listNotices
);
noticeRouter.get('/banner', optionalAuthMiddleware, noticeController.getHomeBanner);
noticeRouter.get('/popup', optionalAuthMiddleware, noticeController.getHomePopup);
noticeRouter.get(
  '/stats',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  noticeController.getAdminStats
);

noticeRouter.get(
  '/:id',
  optionalAuthMiddleware,
  validateParams(noticeIdParamsSchema),
  noticeController.getNotice
);
noticeRouter.get(
  '/:id/attachments/:attachmentId/download',
  optionalAuthMiddleware,
  noticeController.downloadAttachment
);

noticeRouter.post(
  '/',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateBody(createNoticeSchema),
  noticeController.createNotice
);
noticeRouter.put(
  '/:id',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(updateNoticeSchema),
  noticeController.updateNotice
);
noticeRouter.delete(
  '/:id',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  noticeController.deleteNotice
);

noticeRouter.patch(
  '/:id/publish',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(noticePublishBodySchema),
  noticeController.publishNotice
);
noticeRouter.patch(
  '/:id/pin',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(noticeFlagBodySchema),
  noticeController.pinNotice
);
noticeRouter.patch(
  '/:id/important',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(noticeFlagBodySchema),
  noticeController.importantNotice
);
noticeRouter.patch(
  '/:id/banner',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(noticeFlagBodySchema),
  noticeController.bannerNotice
);
noticeRouter.patch(
  '/:id/popup',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  validateBody(noticeFlagBodySchema),
  noticeController.popupNotice
);

noticeRouter.post(
  '/:id/attachments',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  validateParams(noticeIdParamsSchema),
  noticeAttachmentUpload,
  noticeController.uploadAttachment
);
noticeRouter.delete(
  '/:id/attachments/:attachmentId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  noticeController.deleteAttachment
);
