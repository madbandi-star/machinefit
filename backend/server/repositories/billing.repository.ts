import { getPool } from '../config/database.js';
import type {
  AdminSubscriptionRow,
  BillingPlan,
  Coupon,
  CouponHistoryItem,
  MembershipSubscriptionStatus,
  MembershipType,
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
  polar_product_id?: string | null;
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
    polarProductId: row.polar_product_id ?? null,
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
    providerCustomerId: row.provider_customer_id ? String(row.provider_customer_id) : null,
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
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
  };
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code),
    kind: String(row.kind) as Coupon['kind'],
    value: Number(row.value ?? 0),
    maxRedemptions: row.max_redemptions == null ? null : Number(row.max_redemptions),
    redemptionCount: Number(row.redemption_count ?? 0),
    startsAt: row.starts_at ? new Date(String(row.starts_at)).toISOString() : null,
    endsAt: row.ends_at ? new Date(String(row.ends_at)).toISOString() : null,
    isActive: Boolean(row.is_active),
    description: row.description ? String(row.description) : null,
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
      `UPDATE users SET
         trial_consumed_at = COALESCE(trial_consumed_at, NOW()),
         trial_used = TRUE,
         updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  },

  /** True if any durable identity already consumed a free trial. */
  async hasTrialIdentityConsumed(identityKeys: string[]): Promise<boolean> {
    const pool = getPool();
    if (!pool || identityKeys.length === 0) return false;
    try {
      const result = await pool.query<{ ok: boolean }>(
        `SELECT EXISTS(
           SELECT 1 FROM trial_identity_ledger WHERE identity_key = ANY($1::text[])
         ) AS ok`,
        [identityKeys]
      );
      return Boolean(result.rows[0]?.ok);
    } catch {
      // Migration 108 not applied yet — fall back to per-user trial_consumed_at.
      return false;
    }
  },

  async recordTrialIdentities(
    userId: string,
    identities: Array<{ key: string; kind: 'oauth' | 'email' }>,
    source = 'trial'
  ): Promise<void> {
    const pool = getPool();
    if (!pool || identities.length === 0) return;
    for (const identity of identities) {
      try {
        await pool.query(
          `INSERT INTO trial_identity_ledger (identity_key, identity_kind, user_id, source)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (identity_key) DO UPDATE SET
             user_id = COALESCE(trial_identity_ledger.user_id, EXCLUDED.user_id)`,
          [identity.key, identity.kind, userId, source]
        );
      } catch {
        // Soft-fail when ledger table is missing.
      }
    }
  },

  async setEntitlementPlan(userId: string, plan: 'free' | 'premium'): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE users SET
         subscription_plan = $2,
         membership_type = $3,
         updated_at = NOW()
       WHERE id = $1`,
      [userId, plan, plan === 'premium' ? 'PREMIUM' : 'FREE']
    );
  },

  async syncMembershipCache(
    userId: string,
    input: {
      membershipType: MembershipType;
      subscriptionStatus: MembershipSubscriptionStatus;
      premiumStartedAt?: Date | null;
      premiumExpireAt?: Date | null;
      polarCustomerId?: string | null;
      polarSubscriptionId?: string | null;
      trialUsed?: boolean;
    }
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE users SET
         membership_type = $2,
         subscription_status = $3,
         premium_started_at = COALESCE($4, premium_started_at),
         premium_expire_at = $5,
         polar_customer_id = COALESCE($6, polar_customer_id),
         polar_subscription_id = COALESCE($7, polar_subscription_id),
         trial_used = COALESCE($8, trial_used),
         subscription_plan = $9,
         trial_consumed_at = CASE
           WHEN $8 = TRUE THEN COALESCE(trial_consumed_at, NOW())
           ELSE trial_consumed_at
         END,
         updated_at = NOW()
       WHERE id = $1`,
      [
        userId,
        input.membershipType,
        input.subscriptionStatus,
        input.premiumStartedAt ?? null,
        input.premiumExpireAt ?? null,
        input.polarCustomerId ?? null,
        input.polarSubscriptionId ?? null,
        input.trialUsed ?? null,
        input.membershipType === 'PREMIUM' ? 'premium' : 'free',
      ]
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
    providerCustomerId?: string | null;
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
         payment_provider, provider_subscription_id, provider_customer_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
        input.providerCustomerId ?? null,
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
      providerSubscriptionId: string | null;
      providerCustomerId: string | null;
      clearCancelAt: boolean;
    }>
  ): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE subscriptions SET
         status = COALESCE($2, status),
         expire_at = COALESCE($3, expire_at),
         cancel_at = CASE WHEN $9 THEN NULL ELSE COALESCE($4, cancel_at) END,
         trial_end_at = COALESCE($5, trial_end_at),
         start_at = COALESCE($6, start_at),
         plan_id = COALESCE($7, plan_id),
         provider_subscription_id = COALESCE($8, provider_subscription_id),
         provider_customer_id = COALESCE($10, provider_customer_id),
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
        patch.providerSubscriptionId ?? null,
        Boolean(patch.clearCancelAt),
        patch.providerCustomerId ?? null,
      ]
    );
  },

  async findByProviderSubscriptionId(
    providerSubscriptionId: string
  ): Promise<UserSubscription | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(
      `SELECT s.*, p.code AS plan_code
       FROM subscriptions s
       JOIN plan_master p ON p.id = s.plan_id
       WHERE s.provider_subscription_id = $1
       ORDER BY s.updated_at DESC
       LIMIT 1`,
      [providerSubscriptionId]
    );
    return result.rows[0] ? mapSub(result.rows[0]) : null;
  },

  async findUserIdByPolarCustomer(polarCustomerId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE polar_customer_id = $1 LIMIT 1`,
      [polarCustomerId]
    );
    return result.rows[0]?.id ?? null;
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
    invoiceId?: string | null;
  }): Promise<PaymentHistoryItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO payment_history (
         user_id, subscription_id, payment_provider, payment_key, provider_payment_id,
         order_id, amount_cents, currency, status, paid_at, meta, invoice_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
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
        input.invoiceId ?? input.providerPaymentId ?? null,
      ]
    );
    return mapPay(result.rows[0]);
  },

  async markPaymentRefunded(providerPaymentId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `UPDATE payment_history
       SET status = 'REFUNDED'
       WHERE provider_payment_id = $1 OR invoice_id = $1 OR order_id = $1`,
      [providerPaymentId]
    );
  },

  async tryClaimWebhookEvent(input: {
    id: string;
    provider: string;
    eventType?: string;
    payload?: Record<string, unknown>;
  }): Promise<boolean> {
    const pool = getPool();
    if (!pool) return true;
    try {
      await pool.query(
        `INSERT INTO webhook_events (id, provider, event_type, payload)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [input.id, input.provider, input.eventType ?? null, JSON.stringify(input.payload ?? {})]
      );
      return true;
    } catch {
      return false; // duplicate primary key → already processed
    }
  },

  async insertBillingLog(input: {
    userId?: string | null;
    eventType: string;
    status?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO billing_logs (user_id, event_type, status, payload)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [
        input.userId ?? null,
        input.eventType,
        input.status ?? 'ok',
        JSON.stringify(input.payload ?? {}),
      ]
    );
  },

  async listExpiredPremiumUsers(limit = 200): Promise<
    Array<{ userId: string; subscriptionId: string | null }>
  > {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(
      `SELECT u.id AS user_id, s.id AS subscription_id
       FROM users u
       LEFT JOIN LATERAL (
         SELECT id FROM subscriptions sx
         WHERE sx.user_id = u.id
           AND sx.status IN ('ACTIVE', 'TRIAL', 'PAUSED', 'CANCELED')
         ORDER BY sx.updated_at DESC
         LIMIT 1
       ) s ON TRUE
       WHERE u.membership_type = 'PREMIUM'
         AND u.premium_expire_at IS NOT NULL
         AND u.premium_expire_at < NOW()
       LIMIT $1`,
      [limit]
    );
    return result.rows.map((r) => ({
      userId: String(r.user_id),
      subscriptionId: r.subscription_id ? String(r.subscription_id) : null,
    }));
  },

  async listCoupons(): Promise<Coupon[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query(`SELECT * FROM coupons ORDER BY created_at DESC`);
    return result.rows.map(mapCoupon);
  },

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query(`SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) LIMIT 1`, [
      code.trim(),
    ]);
    return result.rows[0] ? mapCoupon(result.rows[0]) : null;
  },

  async createCoupon(input: {
    code: string;
    kind: Coupon['kind'];
    value: number;
    maxRedemptions?: number | null;
    startsAt?: Date | null;
    endsAt?: Date | null;
    description?: string | null;
    createdBy?: string | null;
  }): Promise<Coupon> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO coupons (code, kind, value, max_redemptions, starts_at, ends_at, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        input.code.trim().toUpperCase(),
        input.kind,
        input.value,
        input.maxRedemptions ?? null,
        input.startsAt ?? null,
        input.endsAt ?? null,
        input.description ?? null,
        input.createdBy ?? null,
      ]
    );
    return mapCoupon(result.rows[0]);
  },

  async deleteCoupon(code: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(`DELETE FROM coupons WHERE UPPER(code) = UPPER($1)`, [
      code.trim(),
    ]);
    return (result.rowCount ?? 0) > 0;
  },

  async recordCouponRedemption(input: {
    userId: string;
    couponId: string;
    couponCode: string;
    discountAmount: number;
    freeDays: number;
  }): Promise<CouponHistoryItem> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query(
      `INSERT INTO coupon_history (user_id, coupon_id, coupon_code, discount_amount, free_days)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        input.userId,
        input.couponId,
        input.couponCode,
        input.discountAmount,
        input.freeDays,
      ]
    );
    await pool.query(
      `UPDATE coupons SET redemption_count = redemption_count + 1, updated_at = NOW() WHERE id = $1`,
      [input.couponId]
    );
    const row = result.rows[0];
    return {
      id: String(row.id),
      userId: String(row.user_id),
      couponCode: String(row.coupon_code),
      discountAmount: Number(row.discount_amount ?? 0),
      freeDays: Number(row.free_days ?? 0),
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  },

  async hasCouponRedemption(userId: string, code: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `SELECT 1 FROM coupon_history WHERE user_id = $1 AND UPPER(coupon_code) = UPPER($2) LIMIT 1`,
      [userId, code]
    );
    return Boolean(result.rows[0]);
  },

  async insertReferralReward(input: {
    referrerId: string;
    referredUserId: string;
    rewardDays: number;
  }): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    try {
      await pool.query(
        `INSERT INTO referral_history (referrer_id, referred_user_id, reward_days)
         VALUES ($1,$2,$3)`,
        [input.referrerId, input.referredUserId, input.rewardDays]
      );
      return true;
    } catch {
      return false;
    }
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
              u.membership_type, u.subscription_status AS membership_status,
              u.trial_consumed_at, u.trial_used, r.code AS role_code,
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
      membershipType: String(row.membership_type ?? 'FREE'),
      planCode: row.plan_code ? String(row.plan_code) : null,
      status: (row.status ? String(row.status) : 'NONE') as AdminSubscriptionRow['status'],
      subscriptionStatus: String(row.membership_status ?? 'inactive'),
      isTrial: String(row.status) === 'TRIAL',
      trialConsumed: Boolean(row.trial_consumed_at || row.trial_used),
      expireAt: row.expire_at ? new Date(String(row.expire_at)).toISOString() : null,
      startAt: row.start_at ? new Date(String(row.start_at)).toISOString() : null,
    }));
    return { items, total };
  },
};
