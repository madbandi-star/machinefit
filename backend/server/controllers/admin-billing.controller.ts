import type { Request, Response } from 'express';
import {
  adminCreateCouponSchema,
  adminExtendSubscriptionSchema,
  adminGrantTrialSchema,
  adminListSubscriptionsQuerySchema,
  adminRefundSchema,
  adminSetSubscriptionSchema,
} from '@machinefit/shared';
import { billingService } from '../services/billing.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { writeAdminAudit } from '../utils/admin-audit.util.js';

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
  const userId: string = String(req.params.userId ?? '');
  if (!userId) throw new AppError(400, 'INVALID_USER', 'userId required');
  const data = await billingService.getSubscriptionStatus(userId);
  res.json({ success: true, data });
}

export async function adminExtendSubscription(req: Request, res: Response): Promise<void> {
  const userId: string = String(req.params.userId ?? '');
  const input = adminExtendSubscriptionSchema.parse(req.body ?? {});
  const data = await billingService.adminExtendSubscription(
    userId,
    input.days,
    input.planCode
  );
  writeAdminAudit(req, {
    action: 'admin.subscription.extend',
    targetType: 'user',
    targetId: userId,
    meta: { days: input.days, planCode: input.planCode },
  });
  res.json({ success: true, data });
}

export async function adminEndSubscription(req: Request, res: Response): Promise<void> {
  const userId: string = String(req.params.userId ?? '');
  const data = await billingService.adminEndSubscription(userId);
  writeAdminAudit(req, { action: 'admin.subscription.end', targetType: 'user', targetId: userId });
  res.json({ success: true, data });
}

export async function adminSetSubscription(req: Request, res: Response): Promise<void> {
  const userId: string = String(req.params.userId ?? '');
  const input = adminSetSubscriptionSchema.parse(req.body ?? {});
  const data = await billingService.adminSetSubscription(
    userId,
    input.planCode,
    input.status,
    input.days
  );
  writeAdminAudit(req, {
    action: 'admin.subscription.set',
    targetType: 'user',
    targetId: userId,
    meta: { planCode: input.planCode, status: input.status, days: input.days },
  });
  res.json({ success: true, data });
}

export async function adminGrantTrial(req: Request, res: Response): Promise<void> {
  const userId: string = String(req.params.userId ?? '');
  const input = adminGrantTrialSchema.parse(req.body ?? {});
  const data = await billingService.adminGrantTrial(userId, input.days, input.planCode);
  writeAdminAudit(req, {
    action: 'admin.subscription.grant_trial',
    targetType: 'user',
    targetId: userId,
    meta: { days: input.days, planCode: input.planCode },
  });
  res.json({ success: true, data });
}

export async function adminRefund(req: Request, res: Response): Promise<void> {
  const userId: string = String(req.params.userId ?? '');
  const input = adminRefundSchema.parse(req.body ?? {});
  const data = await billingService.adminRefund(userId, input);
  writeAdminAudit(req, {
    action: 'admin.subscription.refund',
    targetType: 'user',
    targetId: userId,
  });
  res.json({ success: true, data });
}

export async function adminListCoupons(_req: Request, res: Response): Promise<void> {
  const data = await billingService.adminListCoupons();
  res.json({ success: true, data });
}

export async function adminCreateCoupon(req: Request, res: Response): Promise<void> {
  const input = adminCreateCouponSchema.parse(req.body ?? {});
  const data = await billingService.adminCreateCoupon({
    ...input,
    createdBy: req.user?.userId,
  });
  writeAdminAudit(req, {
    action: 'admin.coupon.create',
    targetType: 'coupon',
    targetId: data.code,
    meta: { kind: input.kind, value: input.value },
  });
  res.status(201).json({ success: true, data });
}

export async function adminDeleteCoupon(req: Request, res: Response): Promise<void> {
  const code = String(req.params.code ?? '');
  await billingService.adminDeleteCoupon(code);
  writeAdminAudit(req, {
    action: 'admin.coupon.delete',
    targetType: 'coupon',
    targetId: code,
  });
  res.json({ success: true, data: { deleted: true } });
}
