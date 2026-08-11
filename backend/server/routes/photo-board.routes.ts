import { Router } from 'express';
import { Role, FREE_OPEN_MEMBER_FEATURES_MIN_ROLE } from '@machinefit/shared';
import * as photoBoardController from '../controllers/photo-board.controller.js';
import {
  authMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { photoBoardImagesUpload } from '../middlewares/upload.middleware.js';

export const photoBoardRouter = Router();

/** Free-open: MEMBER+. Paid later → requirePremium() (see FREE_OPEN_MEMBER_FEATURES_MIN_ROLE). */
const requirePhotoBoardMember = [
  authMiddleware,
  requireMinRole(FREE_OPEN_MEMBER_FEATURES_MIN_ROLE),
] as const;

photoBoardRouter.get('/images/:imageId', photoBoardController.getImage);
photoBoardRouter.get('/posts', ...requirePhotoBoardMember, photoBoardController.listPosts);
photoBoardRouter.get('/posts/:postId', ...requirePhotoBoardMember, photoBoardController.getPost);
photoBoardRouter.post(
  '/posts',
  ...requirePhotoBoardMember,
  photoBoardImagesUpload,
  photoBoardController.createPost
);
photoBoardRouter.patch('/posts/:postId', ...requirePhotoBoardMember, photoBoardController.updatePost);
photoBoardRouter.delete('/posts/:postId', ...requirePhotoBoardMember, photoBoardController.deletePost);
photoBoardRouter.post(
  '/posts/:postId/like',
  ...requirePhotoBoardMember,
  photoBoardController.toggleLike
);
photoBoardRouter.post(
  '/posts/:postId/comments',
  ...requirePhotoBoardMember,
  photoBoardController.createComment
);
photoBoardRouter.patch(
  '/comments/:commentId',
  ...requirePhotoBoardMember,
  photoBoardController.updateComment
);
photoBoardRouter.delete(
  '/comments/:commentId',
  ...requirePhotoBoardMember,
  photoBoardController.deleteComment
);
photoBoardRouter.post('/reports', ...requirePhotoBoardMember, photoBoardController.createReport);

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
