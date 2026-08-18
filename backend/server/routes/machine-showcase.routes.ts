import { Router } from 'express';
import { Role, FREE_OPEN_MEMBER_FEATURES_MIN_ROLE } from '@machinefit/shared';
import * as ctrl from '../controllers/machine-showcase.controller.js';
import {
  authMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { machineShowcaseImagesUpload } from '../middlewares/upload.middleware.js';
import { contentWriteRateLimit } from '../middlewares/rate-limit.middleware.js';

export const machineShowcaseRouter = Router();

const requireMember = [
  authMiddleware,
  requireMinRole(FREE_OPEN_MEMBER_FEATURES_MIN_ROLE),
] as const;

const requireAdmin = [authMiddleware, requireMinRole(Role.ADMIN)] as const;

machineShowcaseRouter.get('/images/:imageId', ctrl.getImage);

machineShowcaseRouter.get('/posts', ...requireMember, ctrl.listPosts);
machineShowcaseRouter.get('/posts/:postId', ...requireMember, ctrl.getPost);
machineShowcaseRouter.post(
  '/posts',
  ...requireMember,
  contentWriteRateLimit,
  machineShowcaseImagesUpload,
  ctrl.createPost
);
machineShowcaseRouter.patch('/posts/:postId', ...requireMember, ctrl.updatePost);
machineShowcaseRouter.delete('/posts/:postId', ...requireMember, ctrl.deletePost);

machineShowcaseRouter.post(
  '/posts/:postId/like',
  ...requireMember,
  contentWriteRateLimit,
  ctrl.likePost
);
machineShowcaseRouter.delete('/posts/:postId/like', ...requireMember, ctrl.unlikePost);
machineShowcaseRouter.post(
  '/posts/:postId/bookmark',
  ...requireMember,
  contentWriteRateLimit,
  ctrl.bookmarkPost
);
machineShowcaseRouter.delete('/posts/:postId/bookmark', ...requireMember, ctrl.unbookmarkPost);

machineShowcaseRouter.post(
  '/posts/:postId/comments',
  ...requireMember,
  contentWriteRateLimit,
  ctrl.createComment
);
machineShowcaseRouter.patch('/comments/:commentId', ...requireMember, ctrl.updateComment);
machineShowcaseRouter.delete('/comments/:commentId', ...requireMember, ctrl.deleteComment);

machineShowcaseRouter.post(
  '/reports',
  ...requireMember,
  contentWriteRateLimit,
  ctrl.createReport
);

machineShowcaseRouter.get('/machines/:machineCode/gyms', ...requireMember, ctrl.getMachineGyms);
machineShowcaseRouter.get('/machines/:machineCode/rarity', ...requireMember, ctrl.getRarity);
machineShowcaseRouter.post(
  '/gyms/:userGymId/machines/:machineCode',
  ...requireMember,
  contentWriteRateLimit,
  ctrl.claimGymMachine
);

machineShowcaseRouter.get('/my-dex', ...requireMember, ctrl.getMyDex);
machineShowcaseRouter.get('/my-gym-holdings', ...requireMember, ctrl.getMyGymHoldings);

machineShowcaseRouter.get('/admin/reports', ...requireAdmin, ctrl.adminListReports);
machineShowcaseRouter.patch(
  '/admin/reports/:reportId',
  ...requireAdmin,
  ctrl.adminResolveReport
);
machineShowcaseRouter.patch('/admin/posts/:postId', ...requireAdmin, ctrl.adminPatchPost);
machineShowcaseRouter.delete('/admin/posts/:postId', ...requireAdmin, ctrl.adminHidePost);
machineShowcaseRouter.get('/admin/rarity', ...requireAdmin, ctrl.adminListRarity);
machineShowcaseRouter.patch(
  '/admin/rarity/:machineCode',
  ...requireAdmin,
  ctrl.adminPatchRarity
);
