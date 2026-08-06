import { Role, hasMinRole, roleGrantsPremiumPlan } from './roles.js';
import type { RoleCode } from '../types/api.types.js';
import type { BillingPlanCode, SubscriptionStatus } from '../types/billing.types.js';

/** Map SaaS plan code → existing users.subscription_plan cache value. */
export function billingPlanToEntitlement(planCode: string | null | undefined): 'free' | 'premium' {
  const code = String(planCode ?? 'FREE').toUpperCase();
  if (code === 'PREMIUM' || code === 'VIP') return 'premium';
  return 'free';
}

export function isLiveSubscriptionStatus(status: SubscriptionStatus | string | null | undefined): boolean {
  return status === 'ACTIVE' || status === 'TRIAL' || status === 'PAUSED';
}

/** Premium still usable until expire_at even after cancel-at-period-end. */
export function isPremiumPeriodActive(opts: {
  status?: string | null;
  expireAt?: string | Date | null;
  membershipType?: string | null;
}): boolean {
  const membership = String(opts.membershipType ?? '').toUpperCase();
  if (membership === 'PREMIUM') {
    if (!opts.expireAt) return true;
    return new Date(opts.expireAt).getTime() > Date.now();
  }
  if (!isLiveSubscriptionStatus(opts.status)) return false;
  if (!opts.expireAt) return true;
  return new Date(opts.expireAt).getTime() > Date.now();
}

export function hasPremiumAccess(opts: {
  roleCode?: string | null;
  entitlementPlan?: string | null;
  subscriptionStatus?: string | null;
  planCode?: string | null;
  expireAt?: string | Date | null;
  membershipType?: string | null;
}): boolean {
  if (roleGrantsPremiumPlan(opts.roleCode)) return true;
  if (
    isPremiumPeriodActive({
      membershipType: opts.membershipType,
      status: opts.subscriptionStatus,
      expireAt: opts.expireAt,
    })
  ) {
    return true;
  }
  if (opts.entitlementPlan === 'premium') {
    if (opts.expireAt && new Date(opts.expireAt).getTime() <= Date.now()) return false;
    return true;
  }
  if (isLiveSubscriptionStatus(opts.subscriptionStatus)) {
    const code = String(opts.planCode ?? '').toUpperCase();
    return code === 'PREMIUM' || code === 'VIP';
  }
  return false;
}

export function toMembershipSubscriptionStatus(
  status: SubscriptionStatus | string | null | undefined,
  opts?: { cancelAt?: string | null; expireAt?: string | null }
): 'inactive' | 'trial' | 'active' | 'cancelled' | 'expired' | 'refunded' {
  const s = String(status ?? '').toUpperCase();
  if (s === 'TRIAL') return 'trial';
  if (s === 'EXPIRED') return 'expired';
  if (s === 'FAILED') return 'inactive';
  if (s === 'CANCELED' || opts?.cancelAt) {
    if (opts?.expireAt && new Date(opts.expireAt).getTime() > Date.now()) return 'cancelled';
    return 'cancelled';
  }
  if (s === 'ACTIVE' || s === 'PAUSED' || s === 'PENDING') return 'active';
  return 'inactive';
}

export function hasVipAccess(opts: {
  roleCode?: string | null;
  planCode?: string | null;
  subscriptionStatus?: string | null;
}): boolean {
  if (opts.roleCode === Role.VIP_MEMBER || hasMinRole(opts.roleCode as RoleCode, Role.ADMIN)) {
    return true;
  }
  return (
    isLiveSubscriptionStatus(opts.subscriptionStatus) &&
    String(opts.planCode ?? '').toUpperCase() === 'VIP'
  );
}

export function hasTrainerAccess(roleCode?: string | null): boolean {
  return hasMinRole(roleCode as RoleCode, Role.TRAINER);
}

export function hasOwnerAccess(roleCode?: string | null): boolean {
  return hasMinRole(roleCode as RoleCode, Role.OWNER);
}

export function hasAdminAccess(roleCode?: string | null): boolean {
  return hasMinRole(roleCode as RoleCode, Role.ADMIN);
}

export function defaultTrialDays(planCode: BillingPlanCode | string): number {
  const code = String(planCode).toUpperCase();
  if (code === 'VIP') return 14;
  if (code === 'PREMIUM') return 7;
  return 0;
}
