import type { Request, Response } from 'express';
import {
  adminExtendSubscriptionSchema,
  adminListSubscriptionsQuerySchema,
  adminSetSubscriptionSchema,
} from '@machinefit/shared';
import { billingService } from '../services/billing.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function adminListSubscriptions(req: Request, res: Response): Promise<void> {
  const query = adminListSubscriptionsQuerySchema.parse(req.query);
  const result = await billingService.adminListSubscriptions(query);
  res.json({
    success: true,
    data: {
      items: result.items,
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(result.total / query.limit)),
      },
    },
  });
}

export async function adminGetUserSubscription(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId);
  if (!userId) throw new AppError(400, 'INVALID_USER', 'userId required');
  const data = await billingService.getSubscriptionStatus(userId);
  res.json({ success: true, data });
}

export async function adminExtendSubscription(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId);
  const input = adminExtendSubscriptionSchema.parse(req.body ?? {});
  const data = await billingService.adminExtendSubscription(
    userId,
    input.days,
    input.planCode
  );
  res.json({ success: true, data });
}

export async function adminEndSubscription(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId);
  const data = await billingService.adminEndSubscription(userId);
  res.json({ success: true, data });
}

export async function adminSetSubscription(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId);
  const input = adminSetSubscriptionSchema.parse(req.body ?? {});
  const data = await billingService.adminSetSubscription(
    userId,
    input.planCode,
    input.status,
    input.days
  );
  res.json({ success: true, data });
}
