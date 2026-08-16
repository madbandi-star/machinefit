import type { UsagePolicy, UsagePolicyUpdateInput } from '@machinefit/shared';
import { getPool } from '../config/database.js';

type PolicyRow = {
  id: string;
  feature_code: string;
  feature_name: string;
  description: string;
  category: string;
  free_allowed: boolean;
  free_daily_limit: number | null;
  free_monthly_limit: number | null;
  free_stock_limit: number | null;
  premium_allowed: boolean;
  premium_daily_limit: number | null;
  premium_monthly_limit: number | null;
  premium_stock_limit: number | null;
  limits_enforced: boolean;
  is_active: boolean;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
};

function pool() {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not configured');
  return p;
}

export function mapPolicy(row: PolicyRow): UsagePolicy {
  return {
    id: row.id,
    featureCode: row.feature_code,
    featureName: row.feature_name,
    description: row.description ?? '',
    category: row.category,
    freeAllowed: row.free_allowed,
    freeDailyLimit: row.free_daily_limit,
    freeMonthlyLimit: row.free_monthly_limit,
    freeStockLimit: row.free_stock_limit ?? null,
    premiumAllowed: row.premium_allowed,
    premiumDailyLimit: row.premium_daily_limit,
    premiumMonthlyLimit: row.premium_monthly_limit,
    premiumStockLimit: row.premium_stock_limit ?? null,
    limitsEnforced: row.limits_enforced,
    isActive: row.is_active,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const SELECT = `SELECT * FROM usage_policies`;

export const usagePolicyRepository = {
  async listAll(): Promise<UsagePolicy[]> {
    const { rows } = await pool().query<PolicyRow>(
      `${SELECT} ORDER BY category ASC, feature_name ASC`
    );
    return rows.map(mapPolicy);
  },

  async findById(id: string): Promise<UsagePolicy | null> {
    const { rows } = await pool().query<PolicyRow>(`${SELECT} WHERE id = $1`, [id]);
    return rows[0] ? mapPolicy(rows[0]) : null;
  },

  async findByCode(featureCode: string): Promise<UsagePolicy | null> {
    const { rows } = await pool().query<PolicyRow>(
      `${SELECT} WHERE feature_code = $1`,
      [featureCode]
    );
    return rows[0] ? mapPolicy(rows[0]) : null;
  },

  async update(
    id: string,
    input: UsagePolicyUpdateInput,
    actorId: string | null
  ): Promise<UsagePolicy | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, value: unknown) => {
      values.push(value);
      fields.push(`${col} = $${values.length}`);
    };

    if (input.featureName !== undefined) push('feature_name', input.featureName);
    if (input.description !== undefined) push('description', input.description);
    if (input.freeAllowed !== undefined) push('free_allowed', input.freeAllowed);
    if (input.freeDailyLimit !== undefined) push('free_daily_limit', input.freeDailyLimit);
    if (input.freeMonthlyLimit !== undefined) push('free_monthly_limit', input.freeMonthlyLimit);
    if (input.freeStockLimit !== undefined) push('free_stock_limit', input.freeStockLimit);
    if (input.premiumAllowed !== undefined) push('premium_allowed', input.premiumAllowed);
    if (input.premiumDailyLimit !== undefined) push('premium_daily_limit', input.premiumDailyLimit);
    if (input.premiumMonthlyLimit !== undefined) {
      push('premium_monthly_limit', input.premiumMonthlyLimit);
    }
    if (input.premiumStockLimit !== undefined) push('premium_stock_limit', input.premiumStockLimit);
    if (input.limitsEnforced !== undefined) push('limits_enforced', input.limitsEnforced);
    if (input.isActive !== undefined) push('is_active', input.isActive);

    if (fields.length === 0) return this.findById(id);

    values.push(actorId);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);

    const { rows } = await pool().query<PolicyRow>(
      `UPDATE usage_policies SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );
    return rows[0] ? mapPolicy(rows[0]) : null;
  },

  async insertHistory(input: {
    policyId: string;
    featureCode: string;
    beforeValue: Record<string, unknown>;
    afterValue: Record<string, unknown>;
    changedBy: string | null;
  }): Promise<void> {
    await pool().query(
      `INSERT INTO usage_policy_history
         (policy_id, feature_code, before_value, after_value, changed_by)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
      [
        input.policyId,
        input.featureCode,
        JSON.stringify(input.beforeValue),
        JSON.stringify(input.afterValue),
        input.changedBy,
      ]
    );
  },

  async listHistory(opts: { policyId?: string; page: number; limit: number }) {
    const offset = (opts.page - 1) * opts.limit;
    const params: unknown[] = [];
    let where = '';
    if (opts.policyId) {
      params.push(opts.policyId);
      where = `WHERE h.policy_id = $${params.length}`;
    }
    const countRes = await pool().query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM usage_policy_history h ${where}`,
      params
    );
    params.push(opts.limit, offset);
    const { rows } = await pool().query(
      `SELECT h.id, h.policy_id, h.feature_code, h.before_value, h.after_value,
              h.changed_by, h.created_at,
              u.email AS changed_by_email, u.display_name AS changed_by_name
       FROM usage_policy_history h
       LEFT JOIN users u ON u.id = h.changed_by
       ${where}
       ORDER BY h.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return {
      total: Number(countRes.rows[0]?.c ?? 0),
      items: rows.map((r) => ({
        id: String(r.id),
        policyId: String(r.policy_id),
        featureCode: String(r.feature_code),
        beforeValue: (r.before_value ?? {}) as Record<string, unknown>,
        afterValue: (r.after_value ?? {}) as Record<string, unknown>,
        changedBy: r.changed_by ? String(r.changed_by) : null,
        changedByEmail: null,
        changedByName: r.changed_by_name ? String(r.changed_by_name) : null,
        createdAt: new Date(r.created_at).toISOString(),
      })),
    };
  },
};
