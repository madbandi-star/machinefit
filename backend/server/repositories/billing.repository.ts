import { getPool } from '../config/database.js';
import type {
  AdminSubscriptionRow,
  BillingPlan,
  PaymentHistoryItem,
  SubscriptionStatus,
  UserSubscription,
} from '@machinefit/shared';

type PlanRow = {
  id: string;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price_cents: number;
  currency: string;
  billing_period: string;
  trial_days: number;
  max_gyms: number;
  max_members_per_gym: number;
  display_order: number;
  is_active: boolean;
};

function mapPlan(row: PlanRow): BillingPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name ?? {},
    description: row.description ?? {},
    priceCents: Number(row.price_cents ?? 0),
    currency: row.currency,
    billingPeriod: row.billing_period,
    trialDays: Number(row.trial_days ?? 0),
    maxGyms: Number(row.max_gyms ?? 2),
    maxMembersPerGym: Number(row.max_members_per_gym ?? 2),
    displayOrder: Number(row.display_order ?? 100),
    isActive: Boolean(row.is_active),
  };
}

function mapSub(row: Record<string, unknown>): UserSubscription {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planId: String(row.plan_id),
    planCode: String(row.plan_code ?? ''),
    status: String(row.status) as SubscriptionStatus,
    startAt: row.start_at ? new Date(String(row.start_at)).toISOString() : null,
    expireAt: row.expire_at ? new Date(String(row.expire_at)).toISOString() : null,
    trialEndAt: row.trial_end_at ? new Date(String(row.trial_end_at)).toISOString() : null,
    cancelAt: row.cancel_at ? new Date(String(row.cancel_at)).toISOString() : null,
    paymentProvider: String(row.payment_provider ?? 'dummy'),
    providerSubscriptionId: row.provider_subscription_id
      ? String(row.provider_subscription_id)
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapPay(row: Record<string, unknown>): PaymentHistoryItem {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    subscriptionId: row.subscription_id ? String(row.subscription_id) : null,
    paymentProvider: String(row.payment_provider ?? 'dummy'),
    paymentKey: row.payment_key ? String(row.payment_key) : null,
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : null,
    orderId: String(row.order_id),
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? 'KRW'),
    status: String(row.status) as PaymentHistoryItem['status'],
    paidAt: row.paid_at ? new Date(String(row.paid_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export const billingRepository = {
  async listPlans(activeOnly = true): Promise<BillingPlan[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<PlanRow>(
      activeOnly
        ? `SELECT * FROM plan_master WHERE is_active = TRUE ORDER BY display_order ASC, code ASC`
        : `SELECT * FROM plan_master ORDER BY display_order ASC, code ASC`
    );
    return result.rows.map(mapPlan);
  },

  async getPlanByCode(code: string): Promise<BillingPlan | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<PlanRow>(
      `SELECT * FROM plan_master WHERE UPPER(code) = UPPER($1) LIMIT 1`,
      [code]
    );
    return result.rows[0] ? mapPlan(result.rows[0]) : null;
  },

  async getLiveSubscription(userId: string): Promise<UserSubscription | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT s.*, p.code AS plan_code
       FROM subscriptions s
       JOIN plan_master p ON p.id = s.plan_id
       WHERE s.user_id = $1
         AND s.status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'PENDING')
       ORDER BY s.updated_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapSub(result.rows[0]) : null;
  },

  async getLatestSubscription(userId: string): Promise<UserSubscription | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT s.*, p.code AS plan_code
       FROM subscriptions s
       JOIN plan_master p ON p.id = s.plan_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapSub(result.rows[0]) : null;
  },

  async getTrialConsumedAt(userId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ trial_consumed_at: Date | null }>(
      `SELECT trial_consumed_at FROM users WHERE id = $1`,
      [userId]
    );
    const v = result.rows[0]?.trial_consumed_at;
    return v ? new Date(v).toISOString() : null;
  },

  async markTrialConsumed(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE users SET trial_consumed_at = COALESCE(trial_consumed_at, NOW()), updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  },

  async setEntitlementPlan(userId: string, plan: 'free' | 'premium'): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE users SET subscription_plan = $2, updated_at = NOW() WHERE id = $1`,
      [userId, plan]
    );
  },

  async createSubscription(input: {
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    startAt: Date | null;
    expireAt: Date | null;
    trialEndAt: Date | null;
    paymentProvider: string;
    providerSubscriptionId?: string | null;
  }): Promise<UserSubscription> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    // End previous live rows so unique index allows insert.
    await pool.query(
      `UPDATE subscriptions
       SET status = CASE
         WHEN status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'PENDING') THEN 'CANCELED'
         ELSE status
       END,
       cancel_at = COALESCE(cancel_at, NOW()),
       updated_at = NOW()
       WHERE user_id = $1 AND status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'PENDING')`,
      [input.userId]
    );
    const result = await pool.query(
      `INSERT INTO subscriptions (
         user_id, plan_id, status, start_at, expire_at, trial_end_at,
         payment_provider, provider_subscription_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        input.userId,
        input.planId,
        input.status,
        input.startAt,
        input.expireAt,
        input.trialEndAt,
        input.paymentProvider,
        input.providerSubscriptionId ?? null,
      ]
    );
    const created = await this.getLatestSubscription(input.userId);
    if (!created) throw new Error('Failed to load subscription');
    void result;
    return created;
  },

  async updateSubscription(
    id: string,
    patch: Partial<{
      status: SubscriptionStatus;
      expireAt: Date | null;
      cancelAt: Date | null;
      trialEndAt: Date | null;
      startAt: Date | null;
      planId: string;
    }>
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE subscriptions SET
         status = COALESCE($2, status),
         expire_at = COALESCE($3, expire_at),
         cancel_at = COALESCE($4, cancel_at),
         trial_end_at = COALESCE($5, trial_end_at),
         start_at = COALESCE($6, start_at),
         plan_id = COALESCE($7, plan_id),
         updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        patch.status ?? null,
        patch.expireAt ?? null,
        patch.cancelAt ?? null,
        patch.trialEndAt ?? null,
        patch.startAt ?? null,
        patch.planId ?? null,
      ]
    );
  },

  async listPayments(userId: string, limit = 50): Promise<PaymentHistoryItem[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT * FROM payment_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(mapPay);
  },

  async insertPayment(input: {
    userId: string;
    subscriptionId?: string | null;
    paymentProvider: string;
    paymentKey?: string | null;
    providerPaymentId?: string | null;
    orderId: string;
    amountCents: number;
    currency: string;
    status: PaymentHistoryItem['status'];
    paidAt?: Date | null;
    meta?: Record<string, unknown>;
  }): Promise<PaymentHistoryItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO payment_history (
         user_id, subscription_id, payment_provider, payment_key, provider_payment_id,
         order_id, amount_cents, currency, status, paid_at, meta
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       RETURNING *`,
      [
        input.userId,
        input.subscriptionId ?? null,
        input.paymentProvider,
        input.paymentKey ?? null,
        input.providerPaymentId ?? null,
        input.orderId,
        input.amountCents,
        input.currency,
        input.status,
        input.paidAt ?? null,
        JSON.stringify(input.meta ?? {}),
      ]
    );
    return mapPay(result.rows[0]);
  },

  async getFeatureFlag(key: string): Promise<{
    key: string;
    enabled: boolean;
    minPlanCode: string | null;
    minRoleCode: string | null;
  } | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{
      key: string;
      enabled: boolean;
      min_plan_code: string | null;
      min_role_code: string | null;
    }>(`SELECT key, enabled, min_plan_code, min_role_code FROM feature_flags WHERE key = $1`, [
      key,
    ]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      key: row.key,
      enabled: row.enabled,
      minPlanCode: row.min_plan_code,
      minRoleCode: row.min_role_code,
    };
  },

  async adminList(opts: {
    q?: string;
    status?: string;
    page: number;
    limit: number;
  }): Promise<{ items: AdminSubscriptionRow[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const params: unknown[] = [];
    const where: string[] = ['1=1'];
    if (opts.q?.trim()) {
      params.push(`%${opts.q.trim()}%`);
      where.push(
        `(u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length} OR u.id::text ILIKE $${params.length})`
      );
    }
    if (opts.status === 'expiring') {
      where.push(
        `s.status IN ('ACTIVE','TRIAL') AND s.expire_at IS NOT NULL AND s.expire_at < NOW() + INTERVAL '7 days'`
      );
    } else if (opts.status === 'NONE') {
      where.push(`s.id IS NULL`);
    } else if (opts.status) {
      params.push(opts.status);
      where.push(`s.status = $${params.length}`);
    }

    const whereSql = where.join(' AND ');
    const countRes = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions sx
         WHERE sx.user_id = u.id
         ORDER BY sx.updated_at DESC
         LIMIT 1
       ) s ON TRUE
       WHERE ${whereSql}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.c ?? '0', 10);
    const offset = (opts.page - 1) * opts.limit;
    params.push(opts.limit, offset);
    const result = await pool.query(
      `SELECT u.id AS user_id, u.email, u.display_name, u.subscription_plan,
              u.trial_consumed_at, r.code AS role_code,
              s.status, s.start_at, s.expire_at, s.trial_end_at,
              p.code AS plan_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN LATERAL (
         SELECT * FROM subscriptions sx
         WHERE sx.user_id = u.id
         ORDER BY sx.updated_at DESC
         LIMIT 1
       ) s ON TRUE
       LEFT JOIN plan_master p ON p.id = s.plan_id
       WHERE ${whereSql}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const items: AdminSubscriptionRow[] = result.rows.map((row) => ({
      userId: String(row.user_id),
      email: String(row.email),
      displayName: String(row.display_name),
      roleCode: String(row.role_code),
      entitlementPlan: String(row.subscription_plan ?? 'free'),
      planCode: row.plan_code ? String(row.plan_code) : null,
      status: (row.status ? String(row.status) : 'NONE') as AdminSubscriptionRow['status'],
      isTrial: String(row.status) === 'TRIAL',
      trialConsumed: Boolean(row.trial_consumed_at),
      expireAt: row.expire_at ? new Date(String(row.expire_at)).toISOString() : null,
      startAt: row.start_at ? new Date(String(row.start_at)).toISOString() : null,
    }));
    return { items, total };
  },
};
