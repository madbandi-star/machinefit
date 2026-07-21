import { getPlanLimits, DEFAULT_SUBSCRIPTION_PLAN } from '@machinefit/shared';
import type { SubscriptionPlan } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { AppError } from '../middlewares/error.middleware.js';

export const subscriptionService = {
  async getPlan(userId: string): Promise<SubscriptionPlan> {
    const pool = getPool();
    if (!pool) return DEFAULT_SUBSCRIPTION_PLAN;

    const result = await pool.query<{ subscription_plan: string }>(
      `SELECT subscription_plan FROM users WHERE id = $1`,
      [userId]
    );
    const plan = result.rows[0]?.subscription_plan;
    return plan === 'premium' ? 'premium' : 'free';
  },

  async assertCanAddGym(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;

    const plan = await this.getPlan(userId);
    const limits = getPlanLimits(plan);

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

    const plan = await this.getPlan(userId);
    const limits = getPlanLimits(plan);

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
