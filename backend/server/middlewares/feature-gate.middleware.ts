/**
 * Feature / entitlement gates (additive — does not replace requireMinRole).
 */
import type { Request, Response, NextFunction } from 'express';
import {
  hasAdminAccess,
  hasOwnerAccess,
  hasPremiumAccess,
  hasTrainerAccess,
  hasVipAccess,
} from '@machinefit/shared';
import { billingService } from '../services/billing.service.js';

function unauthorized(res: Response): void {
  res.status(401).json({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
  });
}

function forbidden(res: Response, message = 'Premium entitlement required'): void {
  res.status(403).json({
    success: false,
    error: { code: 'FORBIDDEN', message },
  });
}

export async function hasPremium(userId: string, roleCode?: string | null): Promise<boolean> {
  return billingService.userHasPremiumEntitlement(userId, roleCode);
}

export async function hasVip(userId: string, roleCode?: string | null): Promise<boolean> {
  const status = await billingService.getSubscriptionStatus(userId);
  return hasVipAccess({
    roleCode,
    planCode: status.planCode,
    subscriptionStatus: status.status,
  });
}

export function hasTrainer(roleCode?: string | null): boolean {
  return hasTrainerAccess(roleCode);
}

export function hasOwner(roleCode?: string | null): boolean {
  return hasOwnerAccess(roleCode);
}

export function hasAdmin(roleCode?: string | null): boolean {
  return hasAdminAccess(roleCode);
}

/** Require live PREMIUM/VIP (or role that grants premium). */
export function requirePremium() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    void billingService
      .userHasPremiumEntitlement(req.user.userId, req.user.roleCode)
      .then((ok) => {
        if (!ok) {
          forbidden(res);
          return;
        }
        next();
      })
      .catch((err) => next(err));
  };
}

/** Require VIP plan or vip_member/admin role. */
export function requireVip() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }
    void hasVip(req.user.userId, req.user.roleCode)
      .then((ok) => {
        if (!ok) {
          forbidden(res, 'VIP entitlement required');
          return;
        }
        next();
      })
      .catch((err) => next(err));
  };
}

/**
 * Feature-flag gate. When flag missing → allow (opt-in flags only).
 * When flag exists and disabled → 403.
 * When min_plan_code / min_role_code set, also enforce entitlement.
 */
export function requireFeature(flagKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      const { billingRepository } = await import('../repositories/billing.repository.js');
      const flag = await billingRepository.getFeatureFlag(flagKey);
      if (!flag) {
        next();
        return;
      }
      if (!flag.enabled) {
        forbidden(res, `Feature disabled: ${flagKey}`);
        return;
      }
      if (!req.user) {
        unauthorized(res);
        return;
      }
      if (flag.minRoleCode) {
        const { hasMinRole, isRoleCode } = await import('@machinefit/shared');
        if (isRoleCode(flag.minRoleCode) && !hasMinRole(req.user.roleCode, flag.minRoleCode)) {
          forbidden(res, `Role required for feature: ${flagKey}`);
          return;
        }
      }
      if (flag.minPlanCode) {
        const status = await billingService.getSubscriptionStatus(req.user.userId);
        const ok = hasPremiumAccess({
          roleCode: req.user.roleCode,
          entitlementPlan: status.entitlementPlan,
          subscriptionStatus: status.status,
          planCode: status.planCode,
        });
        const needVip = flag.minPlanCode.toUpperCase() === 'VIP';
        if (needVip) {
          const vipOk = await hasVip(req.user.userId, req.user.roleCode);
          if (!vipOk) {
            forbidden(res, `VIP required for feature: ${flagKey}`);
            return;
          }
        } else if (!ok && flag.minPlanCode.toUpperCase() !== 'FREE') {
          forbidden(res, `Plan required for feature: ${flagKey}`);
          return;
        }
      }
      next();
    })().catch((err) => next(err));
  };
}
