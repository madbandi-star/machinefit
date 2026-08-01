import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

export const communityRouter = Router();

communityRouter.get('/posts', communityController.listPosts);
communityRouter.get('/posts/:postId', optionalAuthMiddleware, communityController.getPost);
communityRouter.post('/posts', authMiddleware, communityController.createPost);
communityRouter.delete('/posts/:postId', authMiddleware, communityController.deletePost);
communityRouter.post('/posts/:postId/comments', authMiddleware, communityController.createComment);
communityRouter.patch(
  '/comments/:commentId',
  authMiddleware,
  communityController.updateComment
);
communityRouter.delete(
  '/comments/:commentId',
  authMiddleware,
  communityController.deleteComment
);
communityRouter.post('/posts/:postId/like', authMiddleware, communityController.toggleLike);
communityRouter.post('/posts/:postId/report', authMiddleware, communityController.reportPost);
communityRouter.post(
  '/comments/:commentId/report',
  authMiddleware,
  communityController.reportComment
);
