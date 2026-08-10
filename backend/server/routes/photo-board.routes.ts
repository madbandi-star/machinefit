import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as photoBoardController from '../controllers/photo-board.controller.js';
import {
  authMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { photoBoardImagesUpload } from '../middlewares/upload.middleware.js';

export const photoBoardRouter = Router();

const requirePremiumMember = [authMiddleware, requireMinRole(Role.PREMIUM_MEMBER)] as const;

photoBoardRouter.get('/images/:imageId', photoBoardController.getImage);
photoBoardRouter.get('/posts', ...requirePremiumMember, photoBoardController.listPosts);
photoBoardRouter.get('/posts/:postId', ...requirePremiumMember, photoBoardController.getPost);
photoBoardRouter.post(
  '/posts',
  ...requirePremiumMember,
  photoBoardImagesUpload,
  photoBoardController.createPost
);
photoBoardRouter.patch('/posts/:postId', ...requirePremiumMember, photoBoardController.updatePost);
photoBoardRouter.delete('/posts/:postId', ...requirePremiumMember, photoBoardController.deletePost);
photoBoardRouter.post(
  '/posts/:postId/like',
  ...requirePremiumMember,
  photoBoardController.toggleLike
);
photoBoardRouter.post(
  '/posts/:postId/comments',
  ...requirePremiumMember,
  photoBoardController.createComment
);
photoBoardRouter.patch(
  '/comments/:commentId',
  ...requirePremiumMember,
  photoBoardController.updateComment
);
photoBoardRouter.delete(
  '/comments/:commentId',
  ...requirePremiumMember,
  photoBoardController.deleteComment
);
photoBoardRouter.post('/reports', ...requirePremiumMember, photoBoardController.createReport);

photoBoardRouter.get(
  '/admin/reports',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  photoBoardController.listReports
);
photoBoardRouter.patch(
  '/admin/reports/:reportId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  photoBoardController.resolveReport
);
photoBoardRouter.delete(
  '/admin/posts/:postId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  photoBoardController.hidePost
);
photoBoardRouter.get(
  '/admin/blocks',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  photoBoardController.listBlocks
);
photoBoardRouter.post(
  '/admin/blocks',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  photoBoardController.blockUser
);
