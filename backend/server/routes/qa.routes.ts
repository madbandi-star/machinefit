import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as qaController from '../controllers/qa.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';

export const qaRouter = Router();

/** Public help-center read APIs */
qaRouter.get('/', optionalAuthMiddleware, qaController.listPublicQa);
qaRouter.get('/categories', optionalAuthMiddleware, qaController.listQaCategories);
qaRouter.get('/:id', optionalAuthMiddleware, qaController.getPublicQa);
qaRouter.post('/:id/feedback', authMiddleware, qaController.feedbackQa);

/** Admin CRUD — also mounted under /admin/qa for dashboard clients */
export const adminQaRouter = Router();
adminQaRouter.use(authMiddleware, requireMinRole(Role.ADMIN));
adminQaRouter.get('/stats', qaController.qaStats);
adminQaRouter.get('/', qaController.listAdminQa);
adminQaRouter.get('/:id', qaController.getAdminQa);
adminQaRouter.post('/', qaController.createQa);
adminQaRouter.patch('/:id', qaController.updateQa);
adminQaRouter.patch('/:id/publish', qaController.publishQa);
adminQaRouter.put('/reorder', qaController.reorderQa);
adminQaRouter.delete('/:id', qaController.deleteQa);
