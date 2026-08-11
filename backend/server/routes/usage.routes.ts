import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as usageController from '../controllers/usage.controller.js';

/** Authenticated client usage tracking (timer/voice/insight/lab). */
export const usageRouter = Router();

usageRouter.use(authMiddleware);
usageRouter.post('/track', (req, res, next) => {
  void usageController.trackEvents(req, res, next);
});
usageRouter.get('/check/:featureCode', (req, res, next) => {
  void usageController.checkLimit(req, res, next);
});
