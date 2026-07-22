import {
  DEFAULT_SUBSCRIPTION_PLAN,
  getEffectivePlanLimits,
  getEffectiveSubscriptionPlan,
  isSubscriptionPlan,
} from '@machinefit/shared';
import type { SubscriptionPlan } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';

type UserPlanRow = {
  subscription_plan: string | null;
  role_code: string | null;
};

async function getUserPlanContext(userId: string): Promise<{
  effectivePlan: SubscriptionPlan;
  roleCode: string | null;
}> {
  const pool = getPool();
  if (!pool) {
    return { effectivePlan: DEFAULT_SUBSCRIPTION_PLAN, roleCode: null };
  }

  const result = await pool.query<UserPlanRow>(
    `SELECT u.subscription_plan, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );
  const storedPlan = isSubscriptionPlan(result.rows[0]?.subscription_plan)
    ? result.rows[0].subscription_plan
    : DEFAULT_SUBSCRIPTION_PLAN;
  const roleCode = result.rows[0]?.role_code ?? null;
  return {
    effectivePlan: getEffectiveSubscriptionPlan(storedPlan, roleCode),
    roleCode,
  };
}

export const subscriptionService = {
  async getPlan(userId: string): Promise<SubscriptionPlan> {
    const { effectivePlan } = await getUserPlanContext(userId);
    return effectivePlan;
  },

  async assertCanAddGym(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    const { effectivePlan, roleCode } = await getUserPlanContext(userId);
    const limits = getEffectivePlanLimits(effectivePlan, roleCode);

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM user_gyms WHERE user_id = $1`,
      [userId]
    );
    const current = parseInt(result.rows[0]?.count ?? '0', 10);
    if (current >= limits.maxGyms) {
      throw new AppError(
        402,
        'PLAN_LIMIT',
        `Gym limit reached for your plan (max ${limits.maxGyms}). Upgrade to premium to add more.`
      );
    }
  },

  async assertCanAddMember(userId: string, gymId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    const { effectivePlan, roleCode } = await getUserPlanContext(userId);
    const limits = getEffectivePlanLimits(effectivePlan, roleCode);

    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM gym_members WHERE gym_id = $1 AND owner_user_id = $2`,
      [gymId, userId]
    );
    const current = parseInt(result.rows[0]?.count ?? '0', 10);
    if (current >= limits.maxMembersPerGym) {
      throw new AppError(
        402,
        'PLAN_LIMIT',
        `Member limit reached for your plan (max ${limits.maxMembersPerGym} per gym). Upgrade to premium.`
      );
    }
  },
};
