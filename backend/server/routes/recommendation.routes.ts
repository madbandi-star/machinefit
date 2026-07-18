import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import * as feedbackController from '../controllers/feedback.controller.js';
import { optionalAuthMiddleware, authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { recommendationSchema } from '@machinefit/shared';

export const recommendationRouter = Router();

recommendationRouter.post(
  '/',
  optionalAuthMiddleware,
  validateBody(recommendationSchema),
  recommendationController.createRecommendation
);
recommendationRouter.post('/feedback', authMiddleware, feedbackController.submitFeedback);
recommendationRouter.get('/:id/feedback', authMiddleware, feedbackController.getFeedback);
recommendationRouter.get('/:id', recommendationController.getRecommendation);
