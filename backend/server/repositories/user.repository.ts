import {
  LEGAL_DOC_VERSIONS,
  type RoleCode,
  type User,
  type Gender,
  type SubscriptionPlan,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';

/** pg may return DATE as Date; `<input type="date">` needs YYYY-MM-DD. */
function normalizeBirthDate(raw: string | Date | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function normalizeBirthTime(raw: string | Date | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return null;
    const hh = String(raw.getUTCHours()).padStart(2, '0');
    const mm = String(raw.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const s = String(raw);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

interface UserRow {
  id: string;
  role_id: string;
  role_code: RoleCode;
  email: string;
  display_name: string;
  gender: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  experience_level: string | null;
  age: number | null;
  birth_date: string | Date | null;
  birth_time: string | Date | null;
  birth_time_unknown: boolean | null;
  workout_goal: string | null;
  home_gym_id: string | null;
  home_gym_name: string | null;
  active_gym_id: string | null;
  country_id: string | null;
  language_id: string | null;
  language_code: string | null;
  unit_height: 'cm' | 'ft_in';
  unit_weight: 'kg' | 'lb';
  timezone: string | null;
  avatar_url: string | null;
  subscription_plan: string | null;
  marketing_opt_in: boolean | null;
  location_opt_in: boolean | null;
  push_service_opt_in: boolean | null;
  terms_version: string | null;
  privacy_version: string | null;
  location_version: string | null;
  marketing_version: string | null;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  location_agreed_at: string | null;
  marketing_agreed_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
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
    age: row.age ?? undefined,
    birthDate: normalizeBirthDate(row.birth_date),
    birthTime: normalizeBirthTime(row.birth_time),
    birthTimeUnknown: Boolean(row.birth_time_unknown),
    workoutGoal: row.workout_goal as User['workoutGoal'],
    homeGymId: row.home_gym_id ?? undefined,
    homeGymName: row.home_gym_name ?? undefined,
    activeGymId: row.active_gym_id ?? undefined,
    countryId: row.country_id ?? undefined,
    languageId: row.language_id ?? undefined,
    languageCode: row.language_code ?? undefined,
    unitHeight: row.unit_height,
    unitWeight: row.unit_weight,
    timezone: row.timezone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    subscriptionPlan: (row.subscription_plan === 'premium' ? 'premium' : 'free') as SubscriptionPlan,
    marketingOptIn: Boolean(row.marketing_opt_in),
    locationOptIn: Boolean(row.location_opt_in),
    pushServiceOptIn: row.push_service_opt_in !== false,
    termsVersion: row.terms_version ?? null,
    privacyVersion: row.privacy_version ?? null,
    locationVersion: row.location_version ?? null,
    marketingVersion: row.marketing_version ?? null,
    termsAgreedAt: row.terms_agreed_at ?? null,
    privacyAgreedAt: row.privacy_agreed_at ?? null,
    locationAgreedAt: row.location_agreed_at ?? null,
    marketingAgreedAt: row.marketing_agreed_at ?? null,
    isActive: row.is_active,
    deactivatedAt: row.deactivated_at ?? null,
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
  async findByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<UserRow>(`${USER_SELECT} WHERE u.email = $1`, [email]);
    if (!result.rows[0]) return null;
    return mapUser(result.rows[0]);
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
    displayName: string;
    gender?: Gender;
    languageCode?: string;
    unitHeight?: 'cm' | 'ft_in';
    unitWeight?: 'kg' | 'lb';
    heightCm?: number;
    weightKg?: number;
    age?: number;
    workoutGoal?: User['workoutGoal'];
    homeGymId?: string | null;
    homeGymName?: string | null;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    marketingOptIn?: boolean;
    locationOptIn?: boolean;
    avatarUrl?: string | null;
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
         role_id, email, display_name, gender, language_id,
         unit_height, unit_weight, height_cm, weight_kg, age, workout_goal,
         home_gym_id, home_gym_name, experience_level, marketing_opt_in, location_opt_in,
         avatar_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        roleId,
        data.email,
        data.displayName,
        data.gender ?? null,
        languageId,
        data.unitHeight ?? 'cm',
        data.unitWeight ?? 'kg',
        data.heightCm ?? null,
        data.weightKg ?? null,
        data.age ?? null,
        data.workoutGoal ?? null,
        data.homeGymId ?? null,
        data.homeGymName ?? null,
        data.experienceLevel ?? 'intermediate',
        Boolean(data.marketingOptIn),
        Boolean(data.locationOptIn),
        data.avatarUrl ?? null,
      ]
    );

    const created = await this.findById(result.rows[0].id);
    if (!created) throw new Error('Failed to create user');
    return created;
  },

  async recordConsents(
    userId: string,
    items: Array<{ type: string; version: string; agreed: boolean }>
  ): Promise<void> {
    const pool = getPool();
    if (!pool || items.length === 0) return;
    for (const item of items) {
      await pool.query(
        `INSERT INTO user_consents (user_id, consent_type, version, agreed)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, consent_type, version)
         DO UPDATE SET agreed = EXCLUDED.agreed, agreed_at = NOW()`,
        [userId, item.type, item.version, item.agreed]
      );
    }

    const terms = items.find((i) => i.type === 'terms' && i.agreed);
    const privacy = items.find((i) => i.type === 'privacy' && i.agreed);
    const location = items.find((i) => i.type === 'location');
    const marketing = items.find((i) => i.type === 'marketing');

    await pool.query(
      `UPDATE users SET
         terms_version = COALESCE($2, terms_version),
         terms_agreed_at = CASE WHEN $2::text IS NOT NULL THEN NOW() ELSE terms_agreed_at END,
         privacy_version = COALESCE($3, privacy_version),
         privacy_agreed_at = CASE WHEN $3::text IS NOT NULL THEN NOW() ELSE privacy_agreed_at END,
         location_version = CASE
           WHEN $4::boolean IS TRUE THEN $5
           WHEN $4::boolean IS FALSE THEN location_version
           ELSE location_version
         END,
         location_agreed_at = CASE
           WHEN $4::boolean IS TRUE THEN NOW()
           WHEN $4::boolean IS FALSE THEN location_agreed_at
           ELSE location_agreed_at
         END,
         location_opt_in = COALESCE($4, location_opt_in),
         marketing_version = CASE
           WHEN $6::boolean IS TRUE THEN $7
           WHEN $6::boolean IS FALSE THEN marketing_version
           ELSE marketing_version
         END,
         marketing_agreed_at = CASE
           WHEN $6::boolean IS TRUE THEN NOW()
           WHEN $6::boolean IS FALSE THEN marketing_agreed_at
           ELSE marketing_agreed_at
         END,
         marketing_opt_in = COALESCE($6, marketing_opt_in),
         updated_at = NOW()
       WHERE id = $1`,
      [
        userId,
        terms?.version ?? null,
        privacy?.version ?? null,
        location ? location.agreed : null,
        location?.version ?? null,
        marketing ? marketing.agreed : null,
        marketing?.version ?? null,
      ]
    );
  },

  /** Required consents (terms + privacy) match current legal versions. */
  needsRequiredConsent(user: Pick<User, 'termsVersion' | 'privacyVersion'>): boolean {
    return (
      user.termsVersion !== LEGAL_DOC_VERSIONS.terms ||
      user.privacyVersion !== LEGAL_DOC_VERSIONS.privacy
    );
  },

  async setMarketingOptIn(userId: string, optIn: boolean): Promise<User | null> {
    const pool = getPool();
    if (!pool) return null;
    await pool.query(`UPDATE users SET marketing_opt_in = $2 WHERE id = $1`, [
      userId,
      optIn,
    ]);
    return this.findById(userId);
  },

  async deactivateAccount(userId: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(
      `UPDATE users
       SET is_active = FALSE,
           deactivated_at = NOW(),
           email = 'deleted+' || id::text || '@invalid.local',
           display_name = '탈퇴회원',
           avatar_url = NULL,
           marketing_opt_in = FALSE,
           location_opt_in = FALSE,
           push_service_opt_in = FALSE,
           gender = NULL,
           height_cm = NULL,
           weight_kg = NULL,
           age = NULL,
           workout_goal = NULL,
           home_gym_id = NULL,
           home_gym_name = NULL,
           timezone = NULL
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );
    await pool.query(`DELETE FROM user_locations WHERE user_id = $1`, [userId]).catch(() => null);
    await this.deleteRefreshTokens(userId);
    return (result.rowCount ?? 0) > 0;
  },

  async listMarketingOptInUserIds(userIds: string[]): Promise<Set<string>> {
    const pool = getPool();
    if (!pool || userIds.length === 0) return new Set();
    const result = await pool.query<{ id: string }>(
      `SELECT id::text AS id FROM users
       WHERE id = ANY($1::uuid[])
         AND is_active = TRUE
         AND marketing_opt_in = TRUE`,
      [userIds]
    );
    return new Set(result.rows.map((r) => r.id));
  },

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      gender?: Gender;
      heightCm?: number;
      weightKg?: number;
      age?: number;
      birthDate?: string | null;
      birthTime?: string | null;
      birthTimeUnknown?: boolean;
      workoutGoal?: User['workoutGoal'];
      homeGymId?: string | null;
      homeGymName?: string | null;
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
    if (data.age !== undefined) {
      fields.push(`age = $${index++}`);
      values.push(data.age);
    }
    if (data.birthDate !== undefined) {
      fields.push(`birth_date = $${index++}`);
      values.push(data.birthDate);
    }
    if (data.birthTimeUnknown !== undefined) {
      fields.push(`birth_time_unknown = $${index++}`);
      values.push(data.birthTimeUnknown);
      if (data.birthTimeUnknown) {
        fields.push(`birth_time = $${index++}`);
        values.push(null);
      }
    }
    if (data.birthTime !== undefined && data.birthTimeUnknown !== true) {
      fields.push(`birth_time = $${index++}`);
      values.push(data.birthTime);
    }
    if (data.workoutGoal !== undefined) {
      fields.push(`workout_goal = $${index++}`);
      values.push(data.workoutGoal);
    }
    if (data.homeGymId !== undefined) {
      fields.push(`home_gym_id = $${index++}`);
      values.push(data.homeGymId);
    }
    if (data.homeGymName !== undefined) {
      fields.push(`home_gym_name = $${index++}`);
      values.push(data.homeGymName);
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

  async hasValidRefreshToken(userId: string, tokenHash: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return true; // Dev/no-DB mode: JWT signature alone is enough.
    const result = await pool.query(
      `SELECT 1 FROM refresh_tokens
       WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()
       LIMIT 1`,
      [userId, tokenHash]
    );
    return result.rows.length > 0;
  },

  async countRefreshTokens(userId: string): Promise<number> {
    const pool = getPool();
    if (!pool) return 0;
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM refresh_tokens WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  },

  async deleteRefreshTokenByHash(userId: string, tokenHash: string): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2', [
      userId,
      tokenHash,
    ]);
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
