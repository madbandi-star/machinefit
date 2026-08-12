import type {
  PointPolicy,
  PointTransaction,
  UserPointsSummary,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

type PolicyRow = {
  id: string;
  action_code: string;
  action_name: string;
  points: number;
  daily_limit: number | null;
  user_limit: number | null;
  cooldown_seconds: number;
  enabled: boolean;
  start_at: Date | string | null;
  end_at: Date | string | null;
  description: string;
  created_at: Date | string;
  updated_at: Date | string;
};

type BalanceRow = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: Date | string;
};

type TxRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  action_code: string | null;
  points: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  idempotency_key: string | null;
  expires_at: Date | string | null;
  created_by: string | null;
  created_at: Date | string;
};

function iso(v: Date | string | null | undefined): string | null {
  if (v == null) return null;
  return typeof v === 'string' ? v : v.toISOString();
}

function mapPolicy(row: PolicyRow): PointPolicy {
  return {
    id: row.id,
    actionCode: row.action_code,
    actionName: row.action_name,
    points: Number(row.points),
    dailyLimit: row.daily_limit == null ? null : Number(row.daily_limit),
    userLimit: row.user_limit == null ? null : Number(row.user_limit),
    cooldownSeconds: Number(row.cooldown_seconds),
    enabled: Boolean(row.enabled),
    startAt: iso(row.start_at),
    endAt: iso(row.end_at),
    description: row.description ?? '',
    createdAt: iso(row.created_at) ?? '',
    updatedAt: iso(row.updated_at) ?? '',
  };
}

function mapSummary(row: BalanceRow): UserPointsSummary {
  return {
    userId: row.user_id,
    balance: Number(row.balance),
    lifetimeEarned: Number(row.lifetime_earned),
    lifetimeSpent: Number(row.lifetime_spent),
    updatedAt: iso(row.updated_at) ?? '',
  };
}

function mapTx(row: TxRow): PointTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    transactionType: row.transaction_type as PointTransaction['transactionType'],
    actionCode: row.action_code,
    points: Number(row.points),
    balanceAfter: Number(row.balance_after),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    description: row.description ?? '',
    idempotencyKey: row.idempotency_key,
    expiresAt: iso(row.expires_at),
    createdBy: row.created_by,
    createdAt: iso(row.created_at) ?? '',
  };
}

export const pointsRepository = {
  async listPolicies(): Promise<PointPolicy[]> {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query<PolicyRow>(
      `SELECT * FROM point_policies ORDER BY action_code ASC`
    );
    return rows.map(mapPolicy);
  },

  async getPolicyByCode(actionCode: string): Promise<PointPolicy | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query<PolicyRow>(
      `SELECT * FROM point_policies WHERE action_code = $1 LIMIT 1`,
      [actionCode]
    );
    return rows[0] ? mapPolicy(rows[0]) : null;
  },

  async updatePolicy(
    id: string,
    patch: {
      actionName?: string;
      points?: number;
      dailyLimit?: number | null;
      userLimit?: number | null;
      cooldownSeconds?: number;
      enabled?: boolean;
      startAt?: string | null;
      endAt?: string | null;
      description?: string;
    }
  ): Promise<PointPolicy | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query<PolicyRow>(
      `UPDATE point_policies SET
         action_name = COALESCE($2, action_name),
         points = COALESCE($3, points),
         daily_limit = CASE WHEN $4::boolean THEN $5 ELSE daily_limit END,
         user_limit = CASE WHEN $6::boolean THEN $7 ELSE user_limit END,
         cooldown_seconds = COALESCE($8, cooldown_seconds),
         enabled = COALESCE($9, enabled),
         start_at = CASE WHEN $10::boolean THEN $11::timestamptz ELSE start_at END,
         end_at = CASE WHEN $12::boolean THEN $13::timestamptz ELSE end_at END,
         description = COALESCE($14, description),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        patch.actionName ?? null,
        patch.points ?? null,
        patch.dailyLimit !== undefined,
        patch.dailyLimit ?? null,
        patch.userLimit !== undefined,
        patch.userLimit ?? null,
        patch.cooldownSeconds ?? null,
        patch.enabled ?? null,
        patch.startAt !== undefined,
        patch.startAt ?? null,
        patch.endAt !== undefined,
        patch.endAt ?? null,
        patch.description ?? null,
      ]
    );
    return rows[0] ? mapPolicy(rows[0]) : null;
  },

  async getSummary(userId: string): Promise<UserPointsSummary> {
    const pool = getPool();
    if (!pool) {
      return {
        userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        updatedAt: new Date().toISOString(),
      };
    }
    const { rows } = await pool.query<BalanceRow>(
      `SELECT user_id, balance, lifetime_earned, lifetime_spent, updated_at
       FROM user_points WHERE user_id = $1`,
      [userId]
    );
    if (rows[0]) return mapSummary(rows[0]);
    return {
      userId,
      balance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      updatedAt: new Date().toISOString(),
    };
  },

  async listTransactions(
    userId: string,
    limit: number,
    offset: number
  ): Promise<PointTransaction[]> {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query<TxRow>(
      `SELECT * FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows.map(mapTx);
  },

  async countEarnToday(userId: string, actionCode: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const { rows } = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM point_transactions
       WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'
         AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul')
             AT TIME ZONE 'Asia/Seoul'`,
      [userId, actionCode]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async countEarnLifetime(userId: string, actionCode: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const { rows } = await pool.query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM point_transactions
       WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'`,
      [userId, actionCode]
    );
    return Number(rows[0]?.c ?? 0);
  },

  async lastEarnAt(userId: string, actionCode: string): Promise<Date | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query<{ created_at: Date }>(
      `SELECT created_at FROM point_transactions
       WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'
       ORDER BY created_at DESC LIMIT 1`,
      [userId, actionCode]
    );
    return rows[0]?.created_at ?? null;
  },

  async hasIdempotencyKey(userId: string, key: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM point_transactions
       WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
      [userId, key]
    );
    return Boolean(rows[0]);
  },

  /**
   * Atomically: lock balance, re-check limits, insert ledger, update balance.
   * Idempotency unique index + FOR UPDATE prevent duplicate / race awards.
   */
  async applyEarn(input: {
    userId: string;
    actionCode: string;
    points: number;
    description: string;
    referenceType?: string | null;
    referenceId?: string | null;
    idempotencyKey: string;
    dailyLimit: number | null;
    userLimit: number | null;
    cooldownSeconds: number;
  }): Promise<
    | { ok: true; summary: UserPointsSummary; tx: PointTransaction }
    | {
        ok: false;
        reason: 'DUPLICATE' | 'DAILY_LIMIT' | 'USER_LIMIT' | 'COOLDOWN';
        summary: UserPointsSummary;
      }
  > {
    const pool = getPool();
    if (!pool) {
      return {
        ok: false,
        reason: 'DUPLICATE',
        summary: {
          userId: input.userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          updatedAt: new Date().toISOString(),
        },
      };
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO user_points (user_id, balance, lifetime_earned, lifetime_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [input.userId]
      );
      const locked = await client.query<BalanceRow>(
        `SELECT user_id, balance, lifetime_earned, lifetime_spent, updated_at
         FROM user_points WHERE user_id = $1 FOR UPDATE`,
        [input.userId]
      );
      const current = locked.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return {
          ok: false,
          reason: 'DUPLICATE',
          summary: {
            userId: input.userId,
            balance: 0,
            lifetimeEarned: 0,
            lifetimeSpent: 0,
            updatedAt: new Date().toISOString(),
          },
        };
      }

      const dup = await client.query<{ id: string }>(
        `SELECT id FROM point_transactions
         WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
        [input.userId, input.idempotencyKey]
      );
      if (dup.rows[0]) {
        await client.query('COMMIT');
        return { ok: false, reason: 'DUPLICATE', summary: mapSummary(current) };
      }

      if (input.dailyLimit != null) {
        const today = await client.query<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM point_transactions
           WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'
             AND created_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul')
                 AT TIME ZONE 'Asia/Seoul'`,
          [input.userId, input.actionCode]
        );
        if (Number(today.rows[0]?.c ?? 0) >= input.dailyLimit) {
          await client.query('COMMIT');
          return { ok: false, reason: 'DAILY_LIMIT', summary: mapSummary(current) };
        }
      }

      if (input.userLimit != null) {
        const lifetime = await client.query<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM point_transactions
           WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'`,
          [input.userId, input.actionCode]
        );
        if (Number(lifetime.rows[0]?.c ?? 0) >= input.userLimit) {
          await client.query('COMMIT');
          return { ok: false, reason: 'USER_LIMIT', summary: mapSummary(current) };
        }
      }

      if (input.cooldownSeconds > 0) {
        const last = await client.query<{ created_at: Date }>(
          `SELECT created_at FROM point_transactions
           WHERE user_id = $1 AND action_code = $2 AND transaction_type = 'EARN'
           ORDER BY created_at DESC LIMIT 1`,
          [input.userId, input.actionCode]
        );
        const lastAt = last.rows[0]?.created_at;
        if (lastAt) {
          const elapsedMs = Date.now() - new Date(lastAt).getTime();
          if (elapsedMs < input.cooldownSeconds * 1000) {
            await client.query('COMMIT');
            return { ok: false, reason: 'COOLDOWN', summary: mapSummary(current) };
          }
        }
      }

      const nextBalance = Number(current.balance) + input.points;
      const nextEarned = Number(current.lifetime_earned) + input.points;
      try {
        const txRes = await client.query<TxRow>(
          `INSERT INTO point_transactions (
             user_id, transaction_type, action_code, points, balance_after,
             reference_type, reference_id, description, idempotency_key
           ) VALUES ($1, 'EARN', $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            input.userId,
            input.actionCode,
            input.points,
            nextBalance,
            input.referenceType ?? null,
            input.referenceId ?? null,
            input.description,
            input.idempotencyKey,
          ]
        );
        await client.query(
          `UPDATE user_points
           SET balance = $2, lifetime_earned = $3, updated_at = NOW()
           WHERE user_id = $1`,
          [input.userId, nextBalance, nextEarned]
        );
        await client.query('COMMIT');
        return {
          ok: true,
          summary: {
            userId: input.userId,
            balance: nextBalance,
            lifetimeEarned: nextEarned,
            lifetimeSpent: Number(current.lifetime_spent),
            updatedAt: new Date().toISOString(),
          },
          tx: mapTx(txRes.rows[0]),
        };
      } catch (err: unknown) {
        const code =
          err && typeof err === 'object' && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        if (code === '23505') {
          await client.query('ROLLBACK');
          const summary = await this.getSummary(input.userId);
          return { ok: false, reason: 'DUPLICATE', summary };
        }
        throw err;
      }
    } catch (error) {
      await client.query('ROLLBACK').catch(() => null);
      throw error;
    } finally {
      client.release();
    }
  },

  async applyAdminAdjust(input: {
    userId: string;
    points: number;
    direction: 'grant' | 'deduct';
    description: string;
    adminId: string;
  }): Promise<{ summary: UserPointsSummary; tx: PointTransaction } | null> {
    const pool = getPool();
    if (!pool) return null;
    const client = await pool.connect();
    const delta = input.direction === 'grant' ? input.points : -input.points;
    const type = input.direction === 'grant' ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT';
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO user_points (user_id, balance, lifetime_earned, lifetime_spent)
         VALUES ($1, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [input.userId]
      );
      const locked = await client.query<BalanceRow>(
        `SELECT user_id, balance, lifetime_earned, lifetime_spent, updated_at
         FROM user_points WHERE user_id = $1 FOR UPDATE`,
        [input.userId]
      );
      const current = locked.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return null;
      }
      const nextBalance = Number(current.balance) + delta;
      if (nextBalance < 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const nextEarned =
        Number(current.lifetime_earned) + (delta > 0 ? delta : 0);
      const nextSpent =
        Number(current.lifetime_spent) + (delta < 0 ? -delta : 0);
      const txRes = await client.query<TxRow>(
        `INSERT INTO point_transactions (
           user_id, transaction_type, action_code, points, balance_after,
           description, created_by, idempotency_key
         ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.userId,
          type,
          delta,
          nextBalance,
          input.description,
          input.adminId,
          `admin:${type}:${input.userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        ]
      );
      await client.query(
        `UPDATE user_points
         SET balance = $2, lifetime_earned = $3, lifetime_spent = $4, updated_at = NOW()
         WHERE user_id = $1`,
        [input.userId, nextBalance, nextEarned, nextSpent]
      );
      await client.query('COMMIT');
      return {
        summary: {
          userId: input.userId,
          balance: nextBalance,
          lifetimeEarned: nextEarned,
          lifetimeSpent: nextSpent,
          updatedAt: new Date().toISOString(),
        },
        tx: mapTx(txRes.rows[0]),
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => null);
      throw error;
    } finally {
      client.release();
    }
  },
};
