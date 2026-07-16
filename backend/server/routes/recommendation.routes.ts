import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller.js';
import { optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { recommendationSchema } from '@machinefit/shared';

export const recommendationRouter = Router();

recommendationRouter.post(
  '/',
  optionalAuthMiddleware,
  validateBody(recommendationSchema),
  recommendationController.createRecommendation
);
recommendationRouter.get('/:id', recommendationController.getRecommendation);
