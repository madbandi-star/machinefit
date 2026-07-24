import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as onlinePtController from '../controllers/online-pt.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';

export const onlinePtRouter = Router();

onlinePtRouter.get('/policy', onlinePtController.getPolicy);
onlinePtRouter.get('/trainers', optionalAuthMiddleware, onlinePtController.listTrainers);
onlinePtRouter.get(
  '/trainers/:trainerId',
  optionalAuthMiddleware,
  onlinePtController.getTrainer
);

onlinePtRouter.use(authMiddleware);

onlinePtRouter.get(
  '/me/trainer-profile',
  requireMinRole(Role.TRAINER),
  onlinePtController.getMyTrainerProfile
);
onlinePtRouter.put(
  '/me/trainer-profile',
  requireMinRole(Role.TRAINER),
  onlinePtController.upsertMyTrainerProfile
);
onlinePtRouter.get(
  '/me/wallet',
  requireMinRole(Role.TRAINER),
  onlinePtController.getWallet
);
onlinePtRouter.get(
  '/me/payouts',
  requireMinRole(Role.TRAINER),
  onlinePtController.listMyPayouts
);
onlinePtRouter.post(
  '/me/payouts',
  requireMinRole(Role.TRAINER),
  onlinePtController.requestPayout
);

onlinePtRouter.get('/me/tickets', requireMinRole(Role.MEMBER), onlinePtController.listMyBalances);
onlinePtRouter.post(
  '/orders',
  requireMinRole(Role.MEMBER),
  onlinePtController.purchaseTickets
);
onlinePtRouter.post(
  '/questions',
  requireMinRole(Role.MEMBER),
  onlinePtController.createQuestion
);
onlinePtRouter.get(
  '/questions',
  requireMinRole(Role.MEMBER),
  onlinePtController.listQuestions
);
onlinePtRouter.get(
  '/questions/:questionId',
  requireMinRole(Role.MEMBER),
  onlinePtController.getQuestion
);
onlinePtRouter.post(
  '/questions/:questionId/answers',
  requireMinRole(Role.TRAINER),
  onlinePtController.answerQuestion
);
onlinePtRouter.post(
  '/questions/:questionId/followups',
  requireMinRole(Role.MEMBER),
  onlinePtController.addFollowup
);
onlinePtRouter.post(
  '/questions/:questionId/reviews',
  requireMinRole(Role.MEMBER),
  onlinePtController.createReview
);

onlinePtRouter.get('/admin/stats', requireMinRole(Role.ADMIN), onlinePtController.adminStats);
onlinePtRouter.get(
  '/admin/trainers',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminListTrainers
);
onlinePtRouter.patch(
  '/admin/trainers/:trainerId',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminReviewTrainer
);
onlinePtRouter.patch(
  '/admin/policy',
  requireMinRole(Role.ADMIN),
  onlinePtController.updatePolicy
);
onlinePtRouter.get(
  '/admin/payouts',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminListPayouts
);
onlinePtRouter.patch(
  '/admin/payouts/:payoutId',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminReviewPayout
);
onlinePtRouter.get(
  '/admin/reviews',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminListReviews
);
onlinePtRouter.get(
  '/admin/reports',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminListReports
);
onlinePtRouter.patch(
  '/admin/reports/:reportId',
  requireMinRole(Role.ADMIN),
  onlinePtController.adminResolveReport
);
onlinePtRouter.post(
  '/admin/process-overdue',
  requireMinRole(Role.ADMIN),
  onlinePtController.processOverdue
);
