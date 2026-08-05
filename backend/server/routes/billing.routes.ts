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
billingRouter.post('/subscription/resume', authMiddleware, billingController.resumeSubscription);
billingRouter.post('/subscription/checkout', authMiddleware, billingController.createCheckout);

billingRouter.get('/payment/history', authMiddleware, billingController.listPaymentHistory);
billingRouter.get('/payment/providers', billingController.listPaymentProviders);
billingRouter.post('/payment/coupon', authMiddleware, billingController.applyCoupon);

/**
 * Spec aliases under /billing/*
 * (mounted at API root → /api/v1/billing/...)
 */
billingRouter.post('/billing/create-checkout', authMiddleware, billingController.createCheckout);
billingRouter.get('/billing/status', authMiddleware, billingController.getBillingStatus);
billingRouter.get('/billing/history', authMiddleware, billingController.listPaymentHistory);
billingRouter.get('/billing/invoices', authMiddleware, billingController.listInvoices);
billingRouter.post('/billing/cancel', authMiddleware, billingController.cancelSubscription);
billingRouter.post('/billing/resume', authMiddleware, billingController.resumeSubscription);
billingRouter.post('/billing/coupon', authMiddleware, billingController.applyCoupon);
