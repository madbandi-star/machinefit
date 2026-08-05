import type { Request, Response } from 'express';
import {
  cancelSubscriptionSchema,
  startTrialSchema,
} from '@machinefit/shared';
import { billingService } from '../services/billing.service.js';
import { AppError } from '../middlewares/error.middleware.js';

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  return req.user;
}

export async function listPlans(_req: Request, res: Response): Promise<void> {
  const data = await billingService.listActivePlans();
  res.json({ success: true, data });
}

export async function getSubscription(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await billingService.getSubscription(user.userId);
  res.json({ success: true, data });
}

export async function getSubscriptionStatus(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await billingService.getSubscriptionStatus(user.userId);
  res.json({ success: true, data });
}

export async function startTrial(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = startTrialSchema.parse(req.body ?? {});
  const data = await billingService.startTrial(user.userId, input.planCode, input.trialDays);
  res.status(201).json({ success: true, data });
}

export async function cancelSubscription(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  cancelSubscriptionSchema.parse(req.body ?? {});
  const data = await billingService.cancelSubscription(user.userId);
  res.json({ success: true, data });
}

export async function listPaymentHistory(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const data = await billingService.listPaymentHistory(user.userId, limit);
  res.json({ success: true, data });
}

export async function listPaymentProviders(_req: Request, res: Response): Promise<void> {
  const data = billingService.listPaymentProviders();
  res.json({ success: true, data });
}
