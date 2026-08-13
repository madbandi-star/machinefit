import type { AuthProviderCode } from '@machinefit/shared';
import { getPool } from '../config/database.js';

export interface AuthProviderRow {
  id: string;
  userId: string;
  provider: AuthProviderCode;
  providerUserId: string;
  providerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthProviderDbRow {
  id: string;
  user_id: string;
  provider: AuthProviderCode;
  provider_user_id: string;
  provider_email: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: AuthProviderDbRow): AuthProviderRow {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerUserId: row.provider_user_id,
    // Never expose stored provider emails.
    providerEmail: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const authProviderRepository = {
  async findByProviderUserId(
    provider: AuthProviderCode,
    providerUserId: string
  ): Promise<AuthProviderRow | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<AuthProviderDbRow>(
      `SELECT * FROM auth_providers
       WHERE provider = $1 AND provider_user_id = $2
       LIMIT 1`,
      [provider, providerUserId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async findByUserId(userId: string): Promise<AuthProviderRow[]> {
    const pool = getPool();
    if (!pool) return [];
    const result = await pool.query<AuthProviderDbRow>(
      `SELECT * FROM auth_providers WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows.map(mapRow);
  },

  async findByUserAndProvider(
    userId: string,
    provider: AuthProviderCode
  ): Promise<AuthProviderRow | null> {
    const pool = getPool();
    if (!pool) return null;
    const result = await pool.query<AuthProviderDbRow>(
      `SELECT * FROM auth_providers
       WHERE user_id = $1 AND provider = $2
       LIMIT 1`,
      [userId, provider]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async create(data: {
    userId: string;
    provider: AuthProviderCode;
    providerUserId: string;
    providerEmail?: string | null;
  }): Promise<AuthProviderRow> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');
    const result = await pool.query<AuthProviderDbRow>(
      `INSERT INTO auth_providers (user_id, provider, provider_user_id, provider_email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.userId, data.provider, data.providerUserId, null]
    );
    return mapRow(result.rows[0]);
  },

  async deleteByUserAndProvider(userId: string, provider: AuthProviderCode): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `DELETE FROM auth_providers WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );
    return (result.rowCount ?? 0) > 0;
  },

  async countByUserId(userId: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM auth_providers WHERE user_id = $1`,
      [userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  },

  /** True if this social subject previously withdrew (archive table). */
  async hasWithdrawalHistory(
    provider: AuthProviderCode,
    providerUserId: string
  ): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    try {
      const result = await pool.query(
        `SELECT 1 FROM auth_provider_withdrawals
         WHERE provider = $1 AND provider_user_id = $2
         LIMIT 1`,
        [provider, providerUserId]
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Detach a live OAuth link that points at a withdrawn/inactive user so re-signup can proceed.
   * Archives the row when possible.
   */
  async releaseInactiveProviderLink(
    provider: AuthProviderCode,
    providerUserId: string
  ): Promise<{ released: boolean; withdrawnUserId: string | null }> {
    const pool = getPool();
    if (!pool) return { released: false, withdrawnUserId: null };
    const link = await this.findByProviderUserId(provider, providerUserId);
    if (!link) return { released: false, withdrawnUserId: null };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO auth_provider_withdrawals (user_id, provider, provider_user_id, provider_email)
           VALUES ($1, $2, $3, $4)`,
          [link.userId, link.provider, link.providerUserId, null]
        );
      } catch {
        /* archive optional / duplicate OK */
      }
      await client.query(`DELETE FROM auth_providers WHERE id = $1`, [link.id]);
      await client.query('COMMIT');
      return { released: true, withdrawnUserId: link.userId };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => null);
      throw error;
    } finally {
      client.release();
    }
  },
};
