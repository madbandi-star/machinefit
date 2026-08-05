import { Router } from 'express';
import * as billingController from '../controllers/billing.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const billingRouter = Router();

billingRouter.get('/plans', billingController.listPlans);

billingRouter.get('/subscription', authMiddleware, billingController.getSubscription);
billingRouter.get(
  '/subscription/status',
  authMiddleware,
  billingController.getSubscriptionStatus
);
billingRouter.post('/subscription/trial', authMiddleware, billingController.startTrial);
billingRouter.post('/subscription/cancel', authMiddleware, billingController.cancelSubscription);

billingRouter.get('/payment/history', authMiddleware, billingController.listPaymentHistory);
billingRouter.get('/payment/providers', billingController.listPaymentProviders);
