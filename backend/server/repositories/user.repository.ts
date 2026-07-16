import type { RoleCode, User } from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface UserRow {
  id: string;
  role_id: string;
  role_code: RoleCode;
  email: string;
  password_hash: string;
  display_name: string;
  gender: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  experience_level: string | null;
  country_id: string | null;
  language_id: string | null;
  language_code: string | null;
  unit_height: 'cm' | 'ft_in';
  unit_weight: 'kg' | 'lb';
  timezone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    roleId: row.role_id,
    roleCode: row.role_code,
    email: row.email,
    displayName: row.display_name,
    gender: row.gender as User['gender'],
    heightCm: row.height_cm ? parseFloat(row.height_cm) : undefined,
    weightKg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
    experienceLevel: row.experience_level as User['experienceLevel'],
    countryId: row.country_id ?? undefined,
    languageId: row.language_id ?? undefined,
    languageCode: row.language_code ?? undefined,
    unitHeight: row.unit_height,
    unitWeight: row.unit_weight,
    timezone: row.timezone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const USER_SELECT = `
  SELECT u.*, r.code AS role_code, l.code AS language_code
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN languages l ON l.id = u.language_id
`;

export const userRepository = {
  async findByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<UserRow & { password_hash: string }>(
      `${USER_SELECT} WHERE u.email = $1`,
      [email]
    );
    if (!result.rows[0]) return null;
    return { ...mapUser(result.rows[0]), passwordHash: result.rows[0].password_hash };
  },

  async findById(id: string): Promise<User | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<UserRow>(
      `${USER_SELECT} WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async create(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    languageCode?: string;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    heightCm?: number;
    weightKg?: number;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  }): Promise<User> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const roleResult = await pool.query<{ id: string }>(
      "SELECT id FROM roles WHERE code = 'member'"
    );
    const roleId = roleResult.rows[0]?.id;
    if (!roleId) throw new Error('Member role not found');

    let languageId: string | null = null;
    if (data.languageCode) {
      const langResult = await pool.query<{ id: string }>(
        'SELECT id FROM languages WHERE code = $1',
        [data.languageCode]
      );
      languageId = langResult.rows[0]?.id ?? null;
    }

    const result = await pool.query<UserRow>(
      `INSERT INTO users (
         role_id, email, password_hash, display_name, language_id,
         unit_height, unit_weight, height_cm, weight_kg, experience_level
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        roleId,
        data.email,
        data.passwordHash,
        data.displayName,
        languageId,
        data.unitHeight ?? 'cm',
        data.unitWeight ?? 'kg',
        data.heightCm ?? null,
        data.weightKg ?? null,
        data.experienceLevel ?? 'intermediate',
      ]
    );

    const created = await this.findById(result.rows[0].id);
    if (!created) throw new Error('Failed to create user');
    return created;
  },

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      gender?: 'male' | 'female' | 'other';
      heightCm?: number;
      weightKg?: number;
      unitHeight?: 'cm' | 'ft_in';
      unitWeight?: 'kg' | 'lb';
      experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    }
  ): Promise<User | null> {
    const pool = getPool();
    if (!pool) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (data.displayName !== undefined) {
      fields.push(`display_name = $${index++}`);
      values.push(data.displayName);
    }
    if (data.gender !== undefined) {
      fields.push(`gender = $${index++}`);
      values.push(data.gender);
    }
    if (data.heightCm !== undefined) {
      fields.push(`height_cm = $${index++}`);
      values.push(data.heightCm);
    }
    if (data.weightKg !== undefined) {
      fields.push(`weight_kg = $${index++}`);
      values.push(data.weightKg);
    }
    if (data.unitHeight !== undefined) {
      fields.push(`unit_height = $${index++}`);
      values.push(data.unitHeight);
    }
    if (data.unitWeight !== undefined) {
      fields.push(`unit_weight = $${index++}`);
      values.push(data.unitWeight);
    }
    if (data.experienceLevel !== undefined) {
      fields.push(`experience_level = $${index++}`);
      values.push(data.experienceLevel);
    }

    if (fields.length === 0) {
      return this.findById(userId);
    }

    values.push(userId);
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index}`,
      values
    );

    return this.findById(userId);
  },

  async updateLastLogin(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
  },

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt]
    );
  },

  async deleteRefreshTokens(userId: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
  },

  async emailExists(email: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  },
};
