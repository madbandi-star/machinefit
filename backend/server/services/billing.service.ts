/**
 * SaaS subscription / Polar billing service.
 * Syncs users.subscription_plan + membership_* cache for PLAN_LIMIT checks.
 */

import { randomUUID } from 'node:crypto';
import {
  billingPlanToEntitlement,
  hasPremiumAccess,
  isLiveSubscriptionStatus,
  toMembershipSubscriptionStatus,
  type BillingPlan,
  type BillingPlanCode,
  type CheckoutSessionResult,
  type Coupon,
  type MembershipSubscriptionStatus,
  type MembershipType,
  type PaymentProviderId,
  type SubscriptionStatus,
  type SubscriptionStatusView,
  type UserSubscription,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { env } from '../config/env.js';
import { billingRepository } from '../repositories/billing.repository.js';
import {
  getPaymentProvider,
  getWebhookPaymentProvider,
  isPolarConfigured,
  listPaymentProviderMeta,
} from '../payments/provider.factory.js';
import type { WebhookEvent } from '../payments/provider.interface.js';
import { decidePremiumActivation } from '../payments/webhook-activate-policy.js';
import { notifyDrAlert } from '../ops/dr-alerts.js';
import { userRepository } from '../repositories/user.repository.js';

const PLAN_CODES: readonly string[] = ['FREE', 'PREMIUM', 'VIP'];
const REFERRAL_REWARD_DAYS = 30;

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

function daysRemaining(expireAt: string | null): number | null {
  if (!expireAt) return null;
  const ms = new Date(expireAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function paymentReady(): boolean {
  return env.PAYMENT_PROVIDER === 'polar' && isPolarConfigured();
}

async function pushMembershipCache(
  userId: string,
  sub: UserSubscription | null,
  opts?: {
    membershipType?: MembershipType;
    subscriptionStatus?: MembershipSubscriptionStatus;
    forceExpire?: boolean;
  }
): Promise<void> {
  if (!sub || opts?.forceExpire) {
    await billingRepository.syncMembershipCache(userId, {
      membershipType: 'FREE',
      subscriptionStatus: opts?.subscriptionStatus ?? 'expired',
      premiumExpireAt: new Date(),
      trialUsed: undefined,
    });
    await billingRepository.setEntitlementPlan(userId, 'free');
    return;
  }

  const membershipType: MembershipType =
    opts?.membershipType ??
    (isLiveSubscriptionStatus(sub.status) ||
    (sub.expireAt && new Date(sub.expireAt).getTime() > Date.now())
      ? billingPlanToEntitlement(sub.planCode) === 'premium'
        ? 'PREMIUM'
        : 'FREE'
      : 'FREE');

  const subscriptionStatus =
    opts?.subscriptionStatus ??
    toMembershipSubscriptionStatus(sub.status, {
      cancelAt: sub.cancelAt,
      expireAt: sub.expireAt,
    });

  await billingRepository.syncMembershipCache(userId, {
    membershipType,
    subscriptionStatus,
    premiumStartedAt: sub.startAt ? new Date(sub.startAt) : new Date(),
    premiumExpireAt: sub.expireAt ? new Date(sub.expireAt) : null,
    polarCustomerId: sub.providerCustomerId ?? null,
    polarSubscriptionId: sub.providerSubscriptionId ?? null,
    trialUsed: sub.status === 'TRIAL' ? true : undefined,
  });
  await billingRepository.setEntitlementPlan(
    userId,
    membershipType === 'PREMIUM' ? 'premium' : 'free'
  );
}

function toStatusView(input: {
  planCode: string;
  status: SubscriptionStatus | 'NONE';
  isTrial: boolean;
  trialConsumed: boolean;
  trialEndAt: string | null;
  startAt: string | null;
  expireAt: string | null;
  cancelAt: string | null;
  entitlementPlan: 'free' | 'premium';
  provider?: string;
}): SubscriptionStatusView {
  const membershipType: MembershipType =
    input.entitlementPlan === 'premium' ? 'PREMIUM' : 'FREE';
  const subscriptionStatus = toMembershipSubscriptionStatus(input.status, {
    cancelAt: input.cancelAt,
    expireAt: input.expireAt,
  });
  const isPremium =
    membershipType === 'PREMIUM' &&
    (!input.expireAt || new Date(input.expireAt).getTime() > Date.now());
  const ready = paymentReady();
  return {
    planCode: input.planCode,
    planLabel: planLabel(input.planCode),
    status: input.status,
    isTrial: input.isTrial,
    trialConsumed: input.trialConsumed,
    trialEndAt: input.trialEndAt,
    startAt: input.startAt,
    expireAt: input.expireAt,
    cancelAt: input.cancelAt,
    entitlementPlan: input.entitlementPlan,
    membershipType,
    subscriptionStatus,
    autoRenew: isPremium && !input.cancelAt && input.status !== 'CANCELED',
    daysRemaining: daysRemaining(input.expireAt),
    nextBillingAt: input.cancelAt ? null : input.expireAt,
    isPremium,
    paymentReady: ready,
    checkoutLabel: ready ? 'Premium 시작하기' : '준비중',
    provider: input.provider ?? env.PAYMENT_PROVIDER,
    manageUrl: null,
  };
}

async function expireIfNeeded(sub: UserSubscription): Promise<UserSubscription | null> {
  if (!sub.expireAt) return sub;
  if (new Date(sub.expireAt).getTime() > Date.now()) return sub;
  if (!isLiveSubscriptionStatus(sub.status) && sub.status !== 'CANCELED') return sub;

  await billingRepository.updateSubscription(sub.id, { status: 'EXPIRED' });
  await pushMembershipCache(sub.userId, sub, {
    membershipType: 'FREE',
    subscriptionStatus: 'expired',
    forceExpire: true,
  });
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
  // Cancelled-but-still-in-period: latest may be CANCELED with future expire
  let entitled = live;
  if (!entitled && latest?.expireAt && new Date(latest.expireAt).getTime() > Date.now()) {
    if (latest.status === 'CANCELED' || latest.cancelAt) {
      entitled = latest;
    }
  }
  const sub = entitled ?? latest;

  if (entitled) {
    await pushMembershipCache(userId, entitled);
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
      cancelAt: null,
      entitlementPlan: 'free',
    });
  }

  const stillPremium =
    Boolean(entitled) &&
    billingPlanToEntitlement(sub.planCode) === 'premium' &&
    (!sub.expireAt || new Date(sub.expireAt).getTime() > Date.now());

  return toStatusView({
    planCode: stillPremium ? sub.planCode : 'FREE',
    status: sub.status,
    isTrial: Boolean(entitled) && sub.status === 'TRIAL',
    trialConsumed: Boolean(trialConsumedAt),
    trialEndAt: sub.trialEndAt,
    startAt: sub.startAt,
    expireAt: sub.expireAt,
    cancelAt: sub.cancelAt,
    entitlementPlan: stillPremium ? 'premium' : 'free',
    provider: sub.paymentProvider,
  });
}

export async function syncUserEntitlementPlan(userId: string): Promise<void> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  await pushMembershipCache(userId, live);
}

function isUsableTrialEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  if (normalized.endsWith('@users.local')) return false;
  if (normalized.endsWith('@invalid.local')) return false;
  if (normalized.startsWith('deleted+')) return false;
  return true;
}

async function collectTrialIdentities(
  userId: string
): Promise<Array<{ key: string; kind: 'oauth' | 'email' }>> {
  const identities: Array<{ key: string; kind: 'oauth' | 'email' }> = [];
  const seen = new Set<string>();

  const push = (key: string, kind: 'oauth' | 'email') => {
    if (seen.has(key)) return;
    seen.add(key);
    identities.push({ key, kind });
  };

  try {
    const { authProviderRepository } = await import('../repositories/auth-provider.repository.js');
    const links = await authProviderRepository.findByUserId(userId);
    for (const link of links) {
      push(`oauth:${link.provider}:${link.providerUserId}`, 'oauth');
      if (isUsableTrialEmail(link.providerEmail)) {
        push(`email:${link.providerEmail.trim().toLowerCase()}`, 'email');
      }
    }
  } catch {
    // auth_providers table may be missing in early boot — OAuth check skipped.
  }

  try {
    const { userRepository } = await import('../repositories/user.repository.js');
    const user = await userRepository.findById(userId);
    if (user && isUsableTrialEmail(user.email)) {
      push(`email:${user.email.trim().toLowerCase()}`, 'email');
    }
  } catch {
    /* ignore */
  }

  return identities;
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

  // Cross-account abuse: same OAuth id / email after deactivate + re-signup.
  const identities = await collectTrialIdentities(userId);
  if (
    identities.length > 0 &&
    (await billingRepository.hasTrialIdentityConsumed(identities.map((i) => i.key)))
  ) {
    await billingRepository.markTrialConsumed(userId);
    throw new AppError(
      409,
      'TRIAL_CONSUMED',
      'Trial already consumed for this login identity'
    );
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
  const mock = await provider.createSubscription({ userId, planCode, trialDays });

  const now = new Date();
  const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const created = await billingRepository.createSubscription({
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
  await billingRepository.recordTrialIdentities(userId, identities, 'trial');
  await pushMembershipCache(userId, created, { subscriptionStatus: 'trial' });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'trial.started',
    payload: { trialDays, planCode, identityCount: identities.length },
  });

  return getSubscriptionStatus(userId);
}

/** Auto-grant 7-day trial on first registration (flag-gated). */
export async function maybeStartSignupTrial(userId: string): Promise<void> {
  const flag = await billingRepository.getFeatureFlag('signup_trial_auto');
  if (flag && !flag.enabled) return;
  try {
    await startTrial(userId, 'PREMIUM', 7);
  } catch {
    // Already consumed / active — ignore
  }
}

/**
 * Before account anonymization: persist OAuth/email keys so a later re-signup
 * cannot claim another free trial after auth_providers are purged.
 */
export async function snapshotTrialIdentitiesOnDeactivate(userId: string): Promise<void> {
  try {
    const consumed = await billingRepository.getTrialConsumedAt(userId);
    if (!consumed) {
      // Still snapshot if trial_used is set without timestamp (legacy rows).
      const pool = (await import('../config/database.js')).getPool();
      if (!pool) return;
      const row = await pool.query<{ trial_used: boolean }>(
        `SELECT trial_used FROM users WHERE id = $1`,
        [userId]
      );
      if (!row.rows[0]?.trial_used) return;
    }
    const identities = await collectTrialIdentities(userId);
    await billingRepository.recordTrialIdentities(userId, identities, 'deactivate');
  } catch {
    /* non-blocking */
  }
}

/** Reuse Polar checkout URL briefly to blunt double-click duplicate sessions. */
const recentCheckoutByUser = new Map<
  string,
  { result: CheckoutSessionResult; expiresAt: number }
>();
const CHECKOUT_REUSE_MS = 60_000;

export async function createCheckout(
  userId: string,
  input: {
    planCode?: string;
    successUrl?: string;
    cancelUrl?: string;
    couponCode?: string;
    email?: string;
    displayName?: string;
  }
): Promise<CheckoutSessionResult> {
  if (!paymentReady()) {
    throw new AppError(503, 'CHECKOUT_UNAVAILABLE', 'Polar checkout is not configured');
  }

  const planCode = requirePlanCode(input.planCode ?? 'PREMIUM');
  if (planCode === 'FREE') {
    throw new AppError(400, 'INVALID_PLAN', 'Cannot checkout FREE plan');
  }

  const reuseKey = `${userId}:${planCode}:${input.couponCode ?? ''}`;
  const cached = recentCheckoutByUser.get(reuseKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const status = await getSubscriptionStatus(userId);
  if (status.isPremium && status.autoRenew) {
    throw new AppError(409, 'SUBSCRIPTION_ACTIVE', 'Already subscribed to Premium');
  }

  const plan = await billingRepository.getPlanByCode(planCode);
  if (!plan?.isActive) throw new AppError(404, 'PLAN_NOT_FOUND', 'Plan not found');

  if (input.couponCode) {
    // Record intent; Polar-side discounts need matching Polar coupon. free_days applied after pay.
    const coupon = await billingRepository.getCouponByCode(input.couponCode);
    if (!coupon?.isActive) {
      throw new AppError(404, 'COUPON_NOT_FOUND', 'Coupon not found');
    }
  }

  const orderId = `mf_${userId.slice(0, 8)}_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const provider = getPaymentProvider('polar');

  const result = await provider.createCheckout({
    userId,
    email: input.email,
    displayName: input.displayName,
    planCode,
    amountCents: plan.priceCents,
    currency: plan.currency,
    orderId,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    polarProductId: plan.polarProductId,
    metadata: input.couponCode ? { couponCode: input.couponCode } : undefined,
  });

  await billingRepository.insertBillingLog({
    userId,
    eventType: 'checkout.created',
    status: result.ready ? 'ok' : 'error',
    payload: { orderId, ready: result.ready, message: result.message },
  });

  if (!result.ready || !result.checkoutUrl) {
    throw new AppError(503, 'CHECKOUT_FAILED', result.message || 'Failed to create checkout');
  }

  const session: CheckoutSessionResult = {
    checkoutUrl: result.checkoutUrl,
    orderId: result.orderId,
    provider: String(result.provider),
    ready: true,
  };
  recentCheckoutByUser.set(reuseKey, {
    result: session,
    expiresAt: Date.now() + CHECKOUT_REUSE_MS,
  });
  return session;
}

/**
 * Cancel at period end — keep Premium until expire_at.
 */
export async function cancelSubscription(userId: string): Promise<SubscriptionStatusView> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  const live = liveRaw ? await expireIfNeeded(liveRaw) : null;
  if (!live) {
    throw new AppError(404, 'NO_SUBSCRIPTION', 'No active subscription to cancel');
  }

  const provider = getPaymentProvider(live.paymentProvider);
  if (live.providerSubscriptionId && live.paymentProvider === 'polar') {
    await provider.cancelSubscription(live.providerSubscriptionId, { atPeriodEnd: true });
  }

  const now = new Date();
  await billingRepository.updateSubscription(live.id, {
    cancelAt: now,
    // Keep ACTIVE until period end so entitlement remains
    status: 'ACTIVE',
  });

  const updated = await billingRepository.getLatestSubscription(userId);
  await pushMembershipCache(userId, updated, { subscriptionStatus: 'cancelled' });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'subscription.cancel_at_period_end',
    payload: { expireAt: live.expireAt },
  });

  return getSubscriptionStatus(userId);
}

/**
 * Best-effort cancel at withdraw. Never throws for "no subscription".
 * Stops Polar renewals so withdrawn accounts are not charged again.
 */
function isRealPolarSubscriptionId(id: string | null | undefined): boolean {
  if (!id?.trim()) return false;
  if (id.startsWith('polar_pending_')) return false;
  if (id.startsWith('admin_ext_')) return false;
  return true;
}

function polarCancelAlreadyGone(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('already canceled') ||
    msg.includes('already cancelled') ||
    msg.includes('revoked')
  );
}

async function revokePolarSubscriptionNow(
  userId: string,
  providerSubscriptionId: string,
  opts?: { enqueueOnFail?: boolean }
): Promise<boolean> {
  try {
    const provider = getPaymentProvider('polar');
    await provider.cancelSubscription(providerSubscriptionId, { atPeriodEnd: false });
    await billingRepository.insertBillingLog({
      userId,
      eventType: 'subscription.cancel_on_withdraw',
      payload: { providerSubId: providerSubscriptionId },
    });
    return true;
  } catch (err) {
    if (polarCancelAlreadyGone(err)) {
      await billingRepository.insertBillingLog({
        userId,
        eventType: 'subscription.cancel_on_withdraw',
        payload: { providerSubId: providerSubscriptionId, alreadyGone: true },
      });
      return true;
    }
    await billingRepository.insertBillingLog({
      userId,
      eventType: 'subscription.cancel_on_withdraw_failed',
      payload: { error: String(err).slice(0, 300), providerSubId: providerSubscriptionId },
    });
    if (opts?.enqueueOnFail !== false) {
      await billingRepository.enqueuePolarCancelRetry(userId, providerSubscriptionId, String(err));
      await notifyDrAlert({
        alertKey: 'polar_cancel_on_withdraw_failed',
        severity: 'critical',
        title: 'Polar cancel after withdraw failed',
        message: `user=${userId} sub=${providerSubscriptionId}`,
        meta: { userId, providerSubscriptionId },
      });
    }
    return false;
  }
}

export async function cancelSubscriptionOnWithdraw(userId: string): Promise<void> {
  const liveRaw = await billingRepository.getLiveSubscription(userId);
  if (!liveRaw) return;
  const live = await expireIfNeeded(liveRaw);
  if (!live) return;

  if (live.paymentProvider === 'polar' && isRealPolarSubscriptionId(live.providerSubscriptionId)) {
    await revokePolarSubscriptionNow(userId, live.providerSubscriptionId as string);
  }

  const now = new Date();
  await billingRepository.updateSubscription(live.id, {
    cancelAt: now,
    status: 'CANCELED',
    expireAt: now,
  });
  await pushMembershipCache(userId, null, {
    subscriptionStatus: 'cancelled',
    forceExpire: true,
  });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'subscription.cancel_on_withdraw',
    payload: { provider: live.paymentProvider },
  });
}

export async function resumeSubscription(userId: string): Promise<SubscriptionStatusView> {
  const latest = await billingRepository.getLatestSubscription(userId);
  if (!latest?.providerSubscriptionId) {
    throw new AppError(404, 'NO_SUBSCRIPTION', 'No subscription to resume');
  }
  if (!latest.cancelAt && latest.status === 'ACTIVE') {
    return getSubscriptionStatus(userId);
  }

  const provider = getPaymentProvider(latest.paymentProvider);
  if (latest.paymentProvider === 'polar') {
    await provider.resumeSubscription(latest.providerSubscriptionId);
  }

  await billingRepository.updateSubscription(latest.id, {
    status: 'ACTIVE',
    clearCancelAt: true,
  });
  const updated = await billingRepository.getLatestSubscription(userId);
  await pushMembershipCache(userId, updated, { subscriptionStatus: 'active' });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'subscription.resumed',
  });
  return getSubscriptionStatus(userId);
}

export async function listPaymentHistory(userId: string, limit = 50) {
  return billingRepository.listPayments(userId, limit);
}

export function listPaymentProviders() {
  const ready = paymentReady();
  return {
    active: env.PAYMENT_PROVIDER as PaymentProviderId,
    providers: listPaymentProviderMeta(),
    checkoutEnabled: ready,
    note: ready
      ? 'Polar checkout enabled'
      : 'Set PAYMENT_PROVIDER=polar and POLAR_* secrets to enable checkout.',
  };
}

export async function applyCoupon(userId: string, codeRaw: string) {
  const coupon = await billingRepository.getCouponByCode(codeRaw);
  if (!coupon || !coupon.isActive) {
    throw new AppError(404, 'COUPON_NOT_FOUND', 'Coupon not found');
  }
  if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
    throw new AppError(400, 'COUPON_NOT_STARTED', 'Coupon is not active yet');
  }
  if (coupon.endsAt && new Date(coupon.endsAt) < new Date()) {
    throw new AppError(400, 'COUPON_EXPIRED', 'Coupon has expired');
  }
  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    throw new AppError(409, 'COUPON_EXHAUSTED', 'Coupon redemption limit reached');
  }
  if (await billingRepository.hasCouponRedemption(userId, coupon.code)) {
    throw new AppError(409, 'COUPON_USED', 'Coupon already used');
  }

  let discountAmount = 0;
  let freeDays = 0;
  if (coupon.kind === 'free_days') {
    freeDays = Math.floor(coupon.value);
    await adminExtendSubscription(userId, freeDays, 'PREMIUM');
  } else if (coupon.kind === 'amount_off') {
    discountAmount = coupon.value;
  } else if (coupon.kind === 'percent_off') {
    discountAmount = coupon.value; // percent stored; Polar-side apply separately
  }

  const history = await billingRepository.recordCouponRedemption({
    userId,
    couponId: coupon.id,
    couponCode: coupon.code,
    discountAmount,
    freeDays,
  });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'coupon.applied',
    payload: { code: coupon.code, kind: coupon.kind, freeDays, discountAmount },
  });
  return { coupon, history, status: await getSubscriptionStatus(userId) };
}

/** Grant Premium days to both referrer and referred (once per referred user). */
export async function grantReferralPremiumReward(
  referrerId: string,
  referredUserId: string
): Promise<void> {
  if (referrerId === referredUserId) return;
  const flag = await billingRepository.getFeatureFlag('referral_premium_reward');
  if (flag && !flag.enabled) return;

  const inserted = await billingRepository.insertReferralReward({
    referrerId,
    referredUserId,
    rewardDays: REFERRAL_REWARD_DAYS,
  });
  if (!inserted) return;

  await adminExtendSubscription(referrerId, REFERRAL_REWARD_DAYS, 'PREMIUM');
  await adminExtendSubscription(referredUserId, REFERRAL_REWARD_DAYS, 'PREMIUM');
  await billingRepository.insertBillingLog({
    userId: referrerId,
    eventType: 'referral.reward',
    payload: { referredUserId, rewardDays: REFERRAL_REWARD_DAYS },
  });
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
    const latest = await billingRepository.getLatestSubscription(userId);
    if (latest?.expireAt && new Date(latest.expireAt).getTime() > Date.now()) {
      live = latest;
    }
  }

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
      paymentProvider: env.PAYMENT_PROVIDER,
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
  const target = live ?? (await billingRepository.getLatestSubscription(userId));
  if (target) {
    await billingRepository.updateSubscription(target.id, {
      status: 'CANCELED',
      cancelAt: new Date(),
      expireAt: new Date(),
    });
  }
  await pushMembershipCache(userId, null, {
    subscriptionStatus: 'expired',
    forceExpire: true,
  });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'admin.end',
  });
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
    await pushMembershipCache(userId, null, {
      subscriptionStatus: status === 'EXPIRED' ? 'expired' : 'inactive',
      forceExpire: true,
    });
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
    const created = await billingRepository.createSubscription({
      userId,
      planId: plan.id,
      status: nextStatus,
      startAt: now,
      expireAt: expire,
      trialEndAt: nextStatus === 'TRIAL' ? expire : null,
      paymentProvider: env.PAYMENT_PROVIDER,
      providerSubscriptionId: `admin_set_${userId.slice(0, 8)}_${Date.now()}`,
    });
    await pushMembershipCache(userId, created, {
      subscriptionStatus: nextStatus === 'TRIAL' ? 'trial' : 'active',
    });
  } else {
    await pushMembershipCache(userId, null, {
      subscriptionStatus: 'inactive',
      forceExpire: true,
    });
  }

  return getSubscriptionStatus(userId);
}

export async function adminGrantTrial(userId: string, days = 7, planCode = 'PREMIUM') {
  // Bypass trial_used for admin grants by extending directly
  return adminExtendSubscription(userId, days, planCode);
}

export async function adminCreateCoupon(input: {
  code: string;
  kind: Coupon['kind'];
  value: number;
  maxRedemptions?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  description?: string | null;
  createdBy?: string | null;
}): Promise<Coupon> {
  return billingRepository.createCoupon({
    code: input.code,
    kind: input.kind,
    value: input.value,
    maxRedemptions: input.maxRedemptions,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    description: input.description,
    createdBy: input.createdBy,
  });
}

export async function adminDeleteCoupon(code: string): Promise<void> {
  const ok = await billingRepository.deleteCoupon(code);
  if (!ok) throw new AppError(404, 'COUPON_NOT_FOUND', 'Coupon not found');
}

export async function adminListCoupons(): Promise<Coupon[]> {
  return billingRepository.listCoupons();
}

export async function adminRefund(
  userId: string,
  input: { paymentId?: string; providerPaymentId?: string; reason?: string }
): Promise<SubscriptionStatusView> {
  const providerPaymentId = input.providerPaymentId || input.paymentId;
  if (!providerPaymentId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'providerPaymentId required');
  }
  const latest = await billingRepository.getLatestSubscription(userId);
  if (latest?.paymentProvider === 'polar' && latest.providerSubscriptionId) {
    try {
      const provider = getPaymentProvider('polar');
      await provider.refund({
        providerPaymentId,
        reason: input.reason,
      });
    } catch {
      // Still revoke locally if Polar refund fails (admin force)
    }
  }
  await billingRepository.markPaymentRefunded(providerPaymentId);
  await adminEndSubscription(userId);
  await billingRepository.syncMembershipCache(userId, {
    membershipType: 'FREE',
    subscriptionStatus: 'refunded',
    premiumExpireAt: new Date(),
  });
  await billingRepository.insertBillingLog({
    userId,
    eventType: 'refund.completed',
    payload: { providerPaymentId, reason: input.reason },
  });
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
    expireAt: status.expireAt,
    membershipType: status.membershipType,
  });
}

async function activatePremiumFromWebhook(
  userId: string,
  event: WebhookEvent
): Promise<void> {
  const plan = await billingRepository.getPlanByCode('PREMIUM');
  if (!plan) return;

  const now = new Date();
  const periodEnd = event.currentPeriodEnd
    ? new Date(event.currentPeriodEnd)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let live = await billingRepository.getLiveSubscription(userId);
  if (live) {
    await billingRepository.updateSubscription(live.id, {
      status: 'ACTIVE',
      startAt: live.startAt ? new Date(live.startAt) : now,
      expireAt: periodEnd,
      providerSubscriptionId: event.providerSubscriptionId ?? undefined,
      providerCustomerId: event.providerCustomerId ?? undefined,
      clearCancelAt: !event.cancelAtPeriodEnd,
      cancelAt: event.cancelAtPeriodEnd ? new Date() : undefined,
    });
  } else {
    live = await billingRepository.createSubscription({
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      startAt: now,
      expireAt: periodEnd,
      trialEndAt: null,
      paymentProvider: 'polar',
      providerSubscriptionId: event.providerSubscriptionId ?? `polar_${Date.now()}`,
      providerCustomerId: event.providerCustomerId ?? null,
    });
  }

  const updated = await billingRepository.getLatestSubscription(userId);
  await pushMembershipCache(userId, updated, {
    subscriptionStatus: event.cancelAtPeriodEnd ? 'cancelled' : 'active',
  });
}

/**
 * Process verified webhook events into subscription/payment rows.
 */
export async function applyWebhookEvent(event: WebhookEvent): Promise<{ handled: boolean }> {
  let userId = event.userId;
  if (!userId && event.providerCustomerId) {
    userId =
      (await billingRepository.findUserIdByPolarCustomer(event.providerCustomerId)) ?? undefined;
  }
  if (!userId && event.providerSubscriptionId) {
    const sub = await billingRepository.findByProviderSubscriptionId(
      event.providerSubscriptionId
    );
    userId = sub?.userId;
  }

  await billingRepository.insertBillingLog({
    userId: userId ?? null,
    eventType: event.type,
    status: 'received',
    payload: event.raw ?? { type: event.type },
  });

  if (
    (event.type === 'payment.succeeded' ||
      event.type === 'subscription.created' ||
      event.type === 'subscription.updated' ||
      event.type === 'subscription.renewed') &&
    userId
  ) {
    const user = await userRepository.findById(userId);
    const gate = await billingRepository.getUserBillingGate(userId);
    const accountWithdrawn = Boolean(user && !user.isActive);
    const decision = decidePremiumActivation({
      eventType: event.type,
      membershipStatus: gate?.subscriptionStatus,
      accountWithdrawn,
    });

    if (event.type === 'payment.succeeded' || event.type === 'subscription.renewed') {
      const orderId =
        event.orderId ??
        event.providerPaymentId ??
        `wh_${event.provider}_${event.eventId ?? Date.now()}`;
      try {
        await billingRepository.insertPayment({
          userId,
          subscriptionId: null,
          paymentProvider: String(event.provider),
          paymentKey: event.providerPaymentId ?? orderId,
          providerPaymentId: event.providerPaymentId ?? null,
          orderId,
          amountCents: event.amountCents ?? 3000,
          currency: event.currency ?? 'KRW',
          status: 'PAID',
          paidAt: new Date(),
          meta: event.raw ?? {},
          invoiceId: event.providerPaymentId ?? null,
        });
      } catch {
        // duplicate order_id — idempotent
      }
    }

    if (decision.activate) {
      await activatePremiumFromWebhook(userId, event);
    } else if (
      event.type === 'subscription.updated' &&
      !accountWithdrawn &&
      gate?.subscriptionStatus !== 'refunded'
    ) {
      const live = await billingRepository.getLiveSubscription(userId);
      if (live && event.currentPeriodEnd) {
        await billingRepository.updateSubscription(live.id, {
          expireAt: new Date(event.currentPeriodEnd),
          cancelAt: event.cancelAtPeriodEnd ? new Date() : undefined,
          clearCancelAt: !event.cancelAtPeriodEnd,
        });
        const updated = await billingRepository.getLatestSubscription(userId);
        await pushMembershipCache(userId, updated, {
          subscriptionStatus: event.cancelAtPeriodEnd ? 'cancelled' : 'active',
        });
      }
      await billingRepository.insertBillingLog({
        userId,
        eventType: 'webhook.ignored_unpaid_activate',
        payload: { type: event.type, reason: decision.reason },
      });
    } else {
      await billingRepository.insertBillingLog({
        userId,
        eventType: 'webhook.skipped_activate',
        payload: { type: event.type, reason: decision.reason },
      });
    }
    return { handled: true };
  }

  if (event.type === 'subscription.canceled' && userId) {
    const live = await billingRepository.getLiveSubscription(userId);
    if (live) {
      await billingRepository.updateSubscription(live.id, {
        cancelAt: new Date(),
        status: 'ACTIVE',
        expireAt: event.currentPeriodEnd
          ? new Date(event.currentPeriodEnd)
          : live.expireAt
            ? new Date(live.expireAt)
            : new Date(),
      });
      const updated = await billingRepository.getLatestSubscription(userId);
      await pushMembershipCache(userId, updated, { subscriptionStatus: 'cancelled' });
    }
    return { handled: true };
  }

  if ((event.type === 'subscription.revoked' || event.type === 'subscription.expired') && userId) {
    await adminEndSubscription(userId);
    return { handled: true };
  }

  if (event.type === 'payment.refunded' && userId) {
    if (event.providerPaymentId) {
      await billingRepository.markPaymentRefunded(event.providerPaymentId);
    }
    await adminEndSubscription(userId);
    await billingRepository.syncMembershipCache(userId, {
      membershipType: 'FREE',
      subscriptionStatus: 'refunded',
      premiumExpireAt: new Date(),
    });
    return { handled: true };
  }

  if (event.type === 'payment.failed') {
    return { handled: true };
  }

  return { handled: false };
}

export async function handleProviderWebhook(
  providerId: string,
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): Promise<{ ok: boolean; handled: boolean; events: number; skipped: number }> {
  const verifier = getWebhookPaymentProvider(providerId);
  const verified = await verifier.verifyWebhook(headers, rawBody);
  if (!verified.ok) {
    await billingRepository.insertBillingLog({
      eventType: 'webhook.invalid',
      status: 'error',
      payload: { providerId, reason: verified.reason },
    });
    throw new AppError(401, 'WEBHOOK_INVALID', verified.reason ?? 'Webhook verification failed');
  }

  let handledCount = 0;
  let skipped = 0;
  for (const event of verified.events) {
    const eventId =
      event.eventId ||
      `${providerId}:${event.type}:${event.providerSubscriptionId ?? event.providerPaymentId ?? randomUUID()}`;
    const claimed = await billingRepository.tryClaimWebhookEvent({
      id: eventId,
      provider: providerId,
      eventType: event.type,
      payload: event.raw,
    });
    if (!claimed) {
      skipped += 1;
      continue;
    }
    const normalized = { ...event, provider: providerId, eventId };
    const result = await applyWebhookEvent(normalized);
    if (result.handled) handledCount += 1;
  }
  return {
    ok: true,
    handled: handledCount > 0,
    events: verified.events.length,
    skipped,
  };
}

const POLAR_CANCEL_RETRY_MAX = 24;

/** Retry Polar immediate cancel after withdraw. */
export async function processPolarCancelRetries(): Promise<number> {
  const due = await billingRepository.listDuePolarCancelRetries(20);
  let done = 0;
  for (const row of due) {
    const ok = await revokePolarSubscriptionNow(row.userId, row.providerSubscriptionId, {
      enqueueOnFail: false,
    });
    if (ok) {
      await billingRepository.markPolarCancelRetryDone(row.id);
      done += 1;
      continue;
    }
    const attempts = row.attempts + 1;
    if (attempts >= POLAR_CANCEL_RETRY_MAX) {
      await notifyDrAlert({
        alertKey: 'polar_cancel_retry_exhausted',
        severity: 'critical',
        title: 'Polar cancel retries exhausted',
        message: `user=${row.userId} sub=${row.providerSubscriptionId}`,
        meta: { userId: row.userId, providerSubscriptionId: row.providerSubscriptionId },
      });
    }
    await billingRepository.bumpPolarCancelRetry(
      row.id,
      attempts,
      `retry ${attempts}/${POLAR_CANCEL_RETRY_MAX}`
    );
  }
  return done;
}

/** Daily scheduler: expire past-due Premium memberships. */
export async function expireOverduePremiums(): Promise<number> {
  const rows = await billingRepository.listExpiredPremiumUsers(500);
  let count = 0;
  for (const row of rows) {
    if (row.subscriptionId) {
      await billingRepository.updateSubscription(row.subscriptionId, {
        status: 'EXPIRED',
        expireAt: new Date(),
      });
    }
    await pushMembershipCache(row.userId, null, {
      subscriptionStatus: 'expired',
      forceExpire: true,
    });
    await billingRepository.insertBillingLog({
      userId: row.userId,
      eventType: 'subscription.expired.scheduler',
    });
    count += 1;
  }
  return count;
}

export const billingService = {
  listActivePlans,
  getSubscription,
  getSubscriptionStatus,
  startTrial,
  maybeStartSignupTrial,
  snapshotTrialIdentitiesOnDeactivate,
  createCheckout,
  cancelSubscription,
  cancelSubscriptionOnWithdraw,
  resumeSubscription,
  listPaymentHistory,
  listPaymentProviders,
  applyCoupon,
  grantReferralPremiumReward,
  adminListSubscriptions,
  adminExtendSubscription,
  adminEndSubscription,
  adminSetSubscription,
  adminGrantTrial,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminRefund,
  isFeatureEnabled,
  userHasPremiumEntitlement,
  syncUserEntitlementPlan,
  handleProviderWebhook,
  expireOverduePremiums,
  processPolarCancelRetries,
};
