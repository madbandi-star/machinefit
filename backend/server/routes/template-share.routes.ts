import { Router } from 'express';
import {
  publishTemplateShareSchema,
  Role,
  templateShareAdminListQuerySchema,
  templateShareAdminStatusSchema,
  templateShareCommentBodySchema,
  templateShareIdParamsSchema,
  templateShareListQuerySchema,
  templateShareReportBodySchema,
  templateShareReportResolveSchema,
  updateTemplateShareSchema,
} from '@machinefit/shared';
import { z } from 'zod';
import * as templateShareController from '../controllers/template-share.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';

export const templateShareRouter = Router();

const commentIdParamsSchema = z.object({
  id: z.string().uuid(),
  commentId: z.string().uuid(),
});

const reportIdParamsSchema = z.object({
  reportId: z.string().uuid(),
});

const admin = Router();
admin.use(authMiddleware, requireMinRole(Role.ADMIN));

admin.get('/stats', templateShareController.getAdminStats);
admin.get('/reports', templateShareController.listReports);
admin.patch(
  '/reports/:reportId',
  validateParams(reportIdParamsSchema),
  validateBody(templateShareReportResolveSchema),
  templateShareController.resolveReport
);
admin.get(
  '/',
  validateQuery(templateShareAdminListQuerySchema),
  templateShareController.listAdminPosts
);
admin.patch(
  '/:id/status',
  validateParams(templateShareIdParamsSchema),
  validateBody(templateShareAdminStatusSchema),
  templateShareController.adminUpdateStatus
);

templateShareRouter.use('/admin', admin);

templateShareRouter.get(
  '/',
  optionalAuthMiddleware,
  validateQuery(templateShareListQuerySchema),
  templateShareController.listPosts
);

templateShareRouter.post(
  '/publish',
  authMiddleware,
  validateBody(publishTemplateShareSchema),
  templateShareController.publish
);

templateShareRouter.get(
  '/:id',
  optionalAuthMiddleware,
  validateParams(templateShareIdParamsSchema),
  templateShareController.getPost
);

templateShareRouter.patch(
  '/:id',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  validateBody(updateTemplateShareSchema),
  templateShareController.updatePost
);

templateShareRouter.post(
  '/:id/download',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  templateShareController.download
);

templateShareRouter.post(
  '/:id/like',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  templateShareController.toggleLike
);

templateShareRouter.post(
  '/:id/favorite',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  templateShareController.toggleFavorite
);

templateShareRouter.get(
  '/:id/comments',
  optionalAuthMiddleware,
  validateParams(templateShareIdParamsSchema),
  templateShareController.listComments
);

templateShareRouter.post(
  '/:id/comments',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  validateBody(templateShareCommentBodySchema),
  templateShareController.createComment
);

templateShareRouter.patch(
  '/:id/comments/:commentId',
  authMiddleware,
  validateParams(commentIdParamsSchema),
  validateBody(templateShareCommentBodySchema),
  templateShareController.updateComment
);

templateShareRouter.delete(
  '/:id/comments/:commentId',
  authMiddleware,
  validateParams(commentIdParamsSchema),
  templateShareController.deleteComment
);

templateShareRouter.post(
  '/:id/report',
  authMiddleware,
  validateParams(templateShareIdParamsSchema),
  validateBody(templateShareReportBodySchema),
  templateShareController.reportPost
);
