/**
 * SaaS subscription / billing service (foundation).
 * Does NOT replace gym/member PLAN_LIMIT logic in subscription.service.ts —
 * it syncs users.subscription_plan when a billing subscription is live.
 */

import {
  billingPlanToEntitlement,
  hasPremiumAccess,
  isLiveSubscriptionStatus,
  type BillingPlan,
  type BillingPlanCode,
  type PaymentProviderId,
  type SubscriptionStatus,
  type SubscriptionStatusView,
  type UserSubscription,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { env } from '../config/env.js';
import { billingRepository } from '../repositories/billing.repository.js';
import { getPaymentProvider, listPaymentProviderMeta } from '../payments/provider.factory.js';
import type { WebhookEvent } from '../payments/provider.interface.js';

const PLAN_CODES: readonly string[] = ['FREE', 'PREMIUM', 'VIP'];

function requirePlanCode(code: string): BillingPlanCode {
  const upper = code.toUpperCase();
  if (!PLAN_CODES.includes(upper)) {
    throw new AppError(400, 'INVALID_PLAN', `Invalid plan code: ${code}`);
  }
  return upper as BillingPlanCode;
}

function planLabel(code: string): string {
  const upper = code.toUpperCase();
  if (upper === 'PREMIUM') return 'PREMIUM';
  if (upper === 'VIP') return 'VIP';
  return 'FREE';
}

function toStatusView(input: {
  planCode: string;
  status: SubscriptionStatus | 'NONE';
  isTrial: boolean;
  trialConsumed: boolean;
  trialEndAt: string | null;
  startAt: string | null;
  expireAt: string | null;
  entitlementPlan: 'free' | 'premium';
}): SubscriptionStatusView {
  return {
    planCode: input.planCode,
    planLabel: planLabel(input.planCode),
    status: input.status,
    isTrial: input.isTrial,
    trialConsumed: input.trialConsumed,
    trialEndAt: input.trialEndAt,
    startAt: input.startAt,
    expireAt: input.expireAt,
    entitlementPlan: input.entitlementPlan,
    paymentReady: false,
    checkoutLabel: '준비중',
  };
}

async function expireIfNeeded(sub: UserSubscription): Promise<UserSubscription | null> {
  if (!isLiveSubscriptionStatus(sub.status)) return sub;
  if (!sub.expireAt) return sub;
  if (new Date(sub.expireAt).getTime() > Date.now()) return sub;

  await billingRepository.updateSubscription(sub.id, { status: 'EXPIRED' });
  await billingRepository.setEntitlementPlan(sub.userId, 'free');
  return null;
}

export async function listActivePlans(): Promise<BillingPlan[]> {
  return billingRepository.listPlans(true);
}

export async function getSubscription(userId: string): Promise<UserSubscription | null> {
  const live = await billingRepository.getLiveSubscription(userId);
  if (live) {
    const kept = await expireIfNeeded(live);
    if (kept) return kept;
  }
  return billingRepository.getLatestSubscription(userId);
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatusView> {
  const [trialConsumedAt, liveRaw, latest] = await Promise.all([
    billingRepository.getTrialConsumedAt(userId),
    billingRepository.getLiveSubscription(userId),
    billingRepository.getLatestSubscription(userId),
  ]);

  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  const sub = live ?? latest;
  const entitlementPlan =
    live && isLiveSubscriptionStatus(live.status)
      ? billingPlanToEntitlement(live.planCode)
      : 'free';

  if (live && entitlementPlan === 'premium') {
    await billingRepository.setEntitlementPlan(userId, 'premium');
  }

  if (!sub) {
    return toStatusView({
      planCode: 'FREE',
      status: 'NONE',
      isTrial: false,
      trialConsumed: Boolean(trialConsumedAt),
      trialEndAt: null,
      startAt: null,
      expireAt: null,
      entitlementPlan: 'free',
    });
  }

  const isLive = Boolean(live && live.id === sub.id);
  return toStatusView({
    planCode: isLive ? sub.planCode : 'FREE',
    status: sub.status,
    isTrial: isLive && sub.status === 'TRIAL',
    trialConsumed: Boolean(trialConsumedAt),
    trialEndAt: sub.trialEndAt,
    startAt: sub.startAt,
    expireAt: sub.expireAt,
    entitlementPlan: isLive ? billingPlanToEntitlement(sub.planCode) : 'free',
  });
}

/** Keep users.subscription_plan in sync for existing PLAN_LIMIT checks. */
export async function syncUserEntitlementPlan(userId: string): Promise<void> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  const planCode = live?.planCode ?? 'FREE';
  await billingRepository.setEntitlementPlan(userId, billingPlanToEntitlement(planCode));
}

export async function startTrial(
  userId: string,
  planCodeRaw: string = 'PREMIUM',
  trialDaysOverride?: number
): Promise<SubscriptionStatusView> {
  const planCode = requirePlanCode(planCodeRaw);
  if (planCode === 'FREE') {
    throw new AppError(400, 'INVALID_PLAN', 'FREE plan cannot start a trial');
  }

  const trialFlag = await billingRepository.getFeatureFlag('trial_enabled');
  if (trialFlag && !trialFlag.enabled) {
    throw new AppError(403, 'TRIAL_DISABLED', 'Trial is currently disabled');
  }

  const consumed = await billingRepository.getTrialConsumedAt(userId);
  if (consumed) {
    throw new AppError(409, 'TRIAL_CONSUMED', 'Trial already consumed for this account');
  }

  const live = await billingRepository.getLiveSubscription(userId);
  if (live) {
    const kept = await expireIfNeeded(live);
    if (kept) {
      throw new AppError(409, 'SUBSCRIPTION_ACTIVE', 'Active subscription already exists');
    }
  }

  const plan = await billingRepository.getPlanByCode(planCode);
  if (!plan || !plan.isActive) {
    throw new AppError(404, 'PLAN_NOT_FOUND', 'Plan not found');
  }

  const trialDays =
    trialDaysOverride && trialDaysOverride > 0
      ? trialDaysOverride
      : plan.trialDays > 0
        ? plan.trialDays
        : 7;

  const provider = getPaymentProvider();
  const mock = await provider.createSubscription({
    userId,
    planCode,
    trialDays,
  });

  const now = new Date();
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  await billingRepository.createSubscription({
    userId,
    planId: plan.id,
    status: 'TRIAL',
    startAt: now,
    expireAt: trialEnd,
    trialEndAt: trialEnd,
    paymentProvider: provider.id,
    providerSubscriptionId: mock.providerSubscriptionId,
  });

  await billingRepository.markTrialConsumed(userId);
  await billingRepository.setEntitlementPlan(userId, billingPlanToEntitlement(planCode));

  return getSubscriptionStatus(userId);
}

export async function cancelSubscription(userId: string): Promise<SubscriptionStatusView> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  if (!live) {
    throw new AppError(404, 'NO_SUBSCRIPTION', 'No active subscription to cancel');
  }

  const provider = getPaymentProvider(live.paymentProvider);
  if (live.providerSubscriptionId) {
    await provider.cancelSubscription(live.providerSubscriptionId);
  }

  const now = new Date();
  await billingRepository.updateSubscription(live.id, {
    status: 'CANCELED',
    cancelAt: now,
    expireAt: now,
  });
  await billingRepository.setEntitlementPlan(userId, 'free');
  return getSubscriptionStatus(userId);
}

export async function listPaymentHistory(userId: string, limit = 50) {
  return billingRepository.listPayments(userId, limit);
}

export function listPaymentProviders() {
  return {
    active: env.PAYMENT_PROVIDER as PaymentProviderId,
    providers: listPaymentProviderMeta(),
    checkoutEnabled: false,
    note: 'Real payment APIs are not connected. Set PAYMENT_PROVIDER when integrating a PG.',
  };
}

export async function adminListSubscriptions(filters: {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return billingRepository.adminList({
    q: filters.q,
    status: filters.status,
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  });
}

export async function adminExtendSubscription(
  userId: string,
  days: number,
  planCodeRaw?: string
): Promise<SubscriptionStatusView> {
  if (!Number.isFinite(days) || days <= 0 || days > 365) {
    throw new AppError(400, 'INVALID_DAYS', 'days must be between 1 and 365');
  }

  let liveRaw = await billingRepository.getLiveSubscription(userId);
  let live = liveRaw ? await expireIfNeeded(liveRaw) : null;

  if (!live) {
    const code = requirePlanCode(planCodeRaw ?? 'PREMIUM');
    if (code === 'FREE') {
      throw new AppError(400, 'INVALID_PLAN', 'Cannot extend FREE plan');
    }
    const plan = await billingRepository.getPlanByCode(code);
    if (!plan) throw new AppError(500, 'PLAN_MISSING', `${code} plan missing`);
    const now = new Date();
    const expire = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    live = await billingRepository.createSubscription({
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      startAt: now,
      expireAt: expire,
      trialEndAt: null,
      paymentProvider: 'dummy',
      providerSubscriptionId: `admin_ext_${userId.slice(0, 8)}_${Date.now()}`,
    });
  } else {
    const base =
      live.expireAt && new Date(live.expireAt) > new Date()
        ? new Date(live.expireAt)
        : new Date();
    const expire = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    await billingRepository.updateSubscription(live.id, {
      expireAt: expire,
      status: live.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
    });
  }

  await syncUserEntitlementPlan(userId);
  return getSubscriptionStatus(userId);
}

export async function adminEndSubscription(userId: string): Promise<SubscriptionStatusView> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  if (live) {
    await billingRepository.updateSubscription(live.id, {
      status: 'CANCELED',
      cancelAt: new Date(),
      expireAt: new Date(),
    });
  }
  await billingRepository.setEntitlementPlan(userId, 'free');
  return getSubscriptionStatus(userId);
}

export async function adminSetSubscription(
  userId: string,
  planCodeRaw: string,
  status: SubscriptionStatus,
  days = 30
): Promise<SubscriptionStatusView> {
  const planCode = requirePlanCode(planCodeRaw);
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  if (liveRaw) {
    await billingRepository.updateSubscription(liveRaw.id, {
      status: 'CANCELED',
      cancelAt: new Date(),
      expireAt: new Date(),
    });
  }

  if (planCode === 'FREE' || status === 'CANCELED' || status === 'EXPIRED') {
    await billingRepository.setEntitlementPlan(userId, 'free');
    if (planCode === 'FREE') {
      return getSubscriptionStatus(userId);
    }
  }

  const plan = await billingRepository.getPlanByCode(planCode);
  if (!plan) throw new AppError(404, 'PLAN_NOT_FOUND', 'Plan not found');

  const now = new Date();
  const expire = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const nextStatus: SubscriptionStatus =
    status === 'TRIAL' ? 'TRIAL' : status === 'ACTIVE' ? 'ACTIVE' : status;

  if (['ACTIVE', 'TRIAL', 'PAUSED', 'PENDING'].includes(nextStatus)) {
    await billingRepository.createSubscription({
      userId,
      planId: plan.id,
      status: nextStatus,
      startAt: now,
      expireAt: expire,
      trialEndAt: nextStatus === 'TRIAL' ? expire : null,
      paymentProvider: 'dummy',
      providerSubscriptionId: `admin_set_${userId.slice(0, 8)}_${Date.now()}`,
    });
    await billingRepository.setEntitlementPlan(userId, billingPlanToEntitlement(planCode));
  } else {
    await billingRepository.setEntitlementPlan(userId, 'free');
  }

  return getSubscriptionStatus(userId);
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const flag = await billingRepository.getFeatureFlag(key);
  return flag?.enabled === true;
}

export async function userHasPremiumEntitlement(
  userId: string,
  roleCode?: string | null
): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  return hasPremiumAccess({
    roleCode,
    entitlementPlan: status.entitlementPlan,
    subscriptionStatus: status.status,
    planCode: status.planCode,
  });
}

/**
 * Process verified webhook events into subscription/payment rows.
 * Dummy / stub providers may send mock payloads during development.
 */
export async function applyWebhookEvent(event: WebhookEvent): Promise<{ handled: boolean }> {
  if (event.type === 'payment.succeeded' && event.userId) {
    const orderId = event.orderId ?? `wh_${event.provider}_${Date.now()}`;
    try {
      await billingRepository.insertPayment({
        userId: event.userId,
        subscriptionId: null,
        paymentProvider: String(event.provider),
        paymentKey: event.providerPaymentId ?? orderId,
        providerPaymentId: event.providerPaymentId ?? null,
        orderId,
        amountCents: event.amountCents ?? 0,
        currency: event.currency ?? 'KRW',
        status: 'PAID',
        paidAt: new Date(),
        meta: event.raw ?? {},
      });
    } catch {
      // Duplicate order_id — treat as idempotent success
    }
    return { handled: true };
  }

  if (event.type === 'subscription.canceled' && event.userId) {
    await adminEndSubscription(event.userId);
    return { handled: true };
  }

  if (event.type === 'subscription.expired' && event.userId) {
    await adminEndSubscription(event.userId);
    return { handled: true };
  }

  return { handled: false };
}

export async function handleProviderWebhook(
  providerId: string,
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): Promise<{ ok: boolean; handled: boolean; events: number }> {
  // Foundation: parse via Dummy so stub providers never reject mock traffic.
  // When a real adapter is registered, call getPaymentProvider(providerId) instead.
  const verifier = getPaymentProvider('dummy');
  const verified = await verifier.verifyWebhook(headers, rawBody);
  if (!verified.ok) {
    throw new AppError(401, 'WEBHOOK_INVALID', verified.reason ?? 'Webhook verification failed');
  }

  let handledCount = 0;
  for (const event of verified.events) {
    const normalized = { ...event, provider: providerId };
    const result = await applyWebhookEvent(normalized);
    if (result.handled) handledCount += 1;
  }
  return { ok: true, handled: handledCount > 0, events: verified.events.length };
}

export const billingService = {
  listActivePlans,
  getSubscription,
  getSubscriptionStatus,
  startTrial,
  cancelSubscription,
  listPaymentHistory,
  listPaymentProviders,
  adminListSubscriptions,
  adminExtendSubscription,
  adminEndSubscription,
  adminSetSubscription,
  isFeatureEnabled,
  userHasPremiumEntitlement,
  syncUserEntitlementPlan,
  handleProviderWebhook,
};
