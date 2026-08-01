import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as photoBoardController from '../controllers/photo-board.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { photoBoardImagesUpload } from '../middlewares/upload.middleware.js';

export const photoBoardRouter = Router();

photoBoardRouter.get('/images/:imageId', photoBoardController.getImage);
photoBoardRouter.get('/posts', optionalAuthMiddleware, photoBoardController.listPosts);
photoBoardRouter.get('/posts/:postId', optionalAuthMiddleware, photoBoardController.getPost);
photoBoardRouter.post(
  '/posts',
  authMiddleware,
  photoBoardImagesUpload,
  photoBoardController.createPost
);
photoBoardRouter.patch('/posts/:postId', authMiddleware, photoBoardController.updatePost);
photoBoardRouter.delete('/posts/:postId', authMiddleware, photoBoardController.deletePost);
photoBoardRouter.post('/posts/:postId/like', authMiddleware, photoBoardController.toggleLike);
photoBoardRouter.post('/posts/:postId/comments', authMiddleware, photoBoardController.createComment);
photoBoardRouter.patch(
  '/comments/:commentId',
  authMiddleware,
  photoBoardController.updateComment
);
photoBoardRouter.delete(
  '/comments/:commentId',
  authMiddleware,
  photoBoardController.deleteComment
);
photoBoardRouter.post('/reports', authMiddleware, photoBoardController.createReport);

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
