import type { CreateUserGymInput, UpdateUserGymInput, UserGym } from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { randomUUID } from 'node:crypto';

interface UserGymRow {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  brand_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserGymRow): UserGym {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address ?? undefined,
    brandName: row.brand_name ?? undefined,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** In-memory fallback when DATABASE_URL is unset. */
const mockGyms = new Map<string, UserGym[]>();

function getMockList(userId: string): UserGym[] {
  return mockGyms.get(userId) ?? [];
}

function setMockList(userId: string, items: UserGym[]) {
  mockGyms.set(userId, items);
}

export const userGymRepository = {
  async listByUser(userId: string): Promise<UserGym[]> {
    const pool = getPool();
    if (!pool) {
      return getMockList(userId).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    const result = await pool.query<UserGymRow>(
      `SELECT * FROM user_gyms WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    return result.rows.map(mapRow);
  },

  async findByIdForUser(userId: string, gymId: string): Promise<UserGym | null> {
    const pool = getPool();
    if (!pool) {
      return getMockList(userId).find((g) => g.id === gymId) ?? null;
    }

    const result = await pool.query<UserGymRow>(
      `SELECT * FROM user_gyms WHERE id = $1 AND user_id = $2`,
      [gymId, userId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async ensureDefaultGym(userId: string, preferredName?: string): Promise<UserGym> {
    const existing = await this.listByUser(userId);
    if (existing.length > 0) {
      return existing.find((g) => g.isDefault) ?? existing[0]!;
    }

    return this.create(userId, {
      name: preferredName?.trim() || '기본 헬스장',
      setActive: true,
      setDefault: true,
    });
  },

  async create(userId: string, input: CreateUserGymInput): Promise<UserGym> {
    const pool = getPool();
    const name = input.name.trim();
    const address = input.address?.trim() || null;
    const brandName = input.brandName?.trim() || null;
    const makeDefault = Boolean(input.setDefault) || (await this.listByUser(userId)).length === 0;

    if (!pool) {
      const now = new Date().toISOString();
      const list = getMockList(userId).map((g) =>
        makeDefault ? { ...g, isDefault: false } : g
      );
      const gym: UserGym = {
        id: randomUUID(),
        userId,
        name,
        address: address ?? undefined,
        brandName: brandName ?? undefined,
        isDefault: makeDefault,
        createdAt: now,
        updatedAt: now,
      };
      list.push(gym);
      setMockList(userId, list);
      return gym;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (makeDefault) {
        await client.query(`UPDATE user_gyms SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }
      const result = await client.query<UserGymRow>(
        `INSERT INTO user_gyms (user_id, name, address, brand_name, is_default)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, name, address, brandName, makeDefault]
      );
      const gym = mapRow(result.rows[0]!);
      if (input.setActive !== false) {
        await client.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [gym.id, userId]);
      }
      await client.query('COMMIT');
      return gym;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async update(userId: string, gymId: string, input: UpdateUserGymInput): Promise<UserGym | null> {
    const current = await this.findByIdForUser(userId, gymId);
    if (!current) return null;

    const pool = getPool();
    const name = input.name?.trim() ?? current.name;
    const address =
      input.address === undefined
        ? current.address ?? null
        : input.address === null || input.address === ''
          ? null
          : input.address.trim();
    const brandName =
      input.brandName === undefined
        ? current.brandName ?? null
        : input.brandName === null || input.brandName === ''
          ? null
          : input.brandName.trim();
    const isDefault = input.isDefault ?? current.isDefault;

    if (!pool) {
      const list = getMockList(userId).map((g) => {
        if (isDefault && g.id !== gymId) return { ...g, isDefault: false };
        if (g.id !== gymId) return g;
        return {
          ...g,
          name,
          address: address ?? undefined,
          brandName: brandName ?? undefined,
          isDefault,
          updatedAt: new Date().toISOString(),
        };
      });
      setMockList(userId, list);
      return list.find((g) => g.id === gymId) ?? null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (isDefault) {
        await client.query(`UPDATE user_gyms SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }
      const result = await client.query<UserGymRow>(
        `UPDATE user_gyms
         SET name = $1, address = $2, brand_name = $3, is_default = $4
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [name, address, brandName, isDefault, gymId, userId]
      );
      await client.query('COMMIT');
      return result.rows[0] ? mapRow(result.rows[0]) : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async remove(userId: string, gymId: string): Promise<boolean> {
    const list = await this.listByUser(userId);
    if (list.length <= 1) return false;
    const target = list.find((g) => g.id === gymId);
    if (!target) return false;

    const pool = getPool();
    if (!pool) {
      const next = list.filter((g) => g.id !== gymId);
      if (target.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
      setMockList(userId, next);
      return true;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM user_gyms WHERE id = $1 AND user_id = $2`, [gymId, userId]);
      if (target.isDefault) {
        const fallback = await client.query<{ id: string }>(
          `SELECT id FROM user_gyms WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [userId]
        );
        if (fallback.rows[0]) {
          await client.query(`UPDATE user_gyms SET is_default = TRUE WHERE id = $1`, [
            fallback.rows[0].id,
          ]);
          await client.query(
            `UPDATE users SET active_gym_id = $1 WHERE id = $2 AND (active_gym_id IS NULL OR active_gym_id = $3)`,
            [fallback.rows[0].id, userId, gymId]
          );
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async setActive(userId: string, gymId: string): Promise<UserGym | null> {
    const gym = await this.findByIdForUser(userId, gymId);
    if (!gym) return null;

    const pool = getPool();
    if (!pool) return gym;

    await pool.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [gymId, userId]);
    return gym;
  },

  async getActiveGymId(userId: string): Promise<string | null> {
    const pool = getPool();
    if (!pool) {
      const list = getMockList(userId);
      return list.find((g) => g.isDefault)?.id ?? list[0]?.id ?? null;
    }

    const result = await pool.query<{ active_gym_id: string | null }>(
      `SELECT active_gym_id FROM users WHERE id = $1`,
      [userId]
    );
    const active = result.rows[0]?.active_gym_id;
    if (active) {
      const owned = await this.findByIdForUser(userId, active);
      if (owned) return owned.id;
    }

    const ensured = await this.ensureDefaultGym(userId);
    await pool.query(`UPDATE users SET active_gym_id = $1 WHERE id = $2`, [ensured.id, userId]);
    return ensured.id;
  },
};
