import type { GymMember, GymMemberProfileRequest } from '@machinefit/shared';
import { getPool } from '../config/database.js';

interface GymMemberRow {
  id: string;
  gym_id: string;
  owner_user_id: string;
  name: string;
  gender: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  birth_date: string | null;
  memo: string | null;
  email: string | null;
  linked_user_id: string | null;
  profile_access: string;
  is_self: boolean;
  created_at: string;
  updated_at: string;
}

interface GymMemberProfileRequestRow {
  id: string;
  member_id: string;
  gym_id: string;
  owner_user_id: string;
  target_user_id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  gym_name?: string | null;
}

function mapMember(row: GymMemberRow): GymMember {
  return {
    id: row.id,
    gymId: row.gym_id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    gender: row.gender as GymMember['gender'],
    heightCm: row.height_cm ? parseFloat(row.height_cm) : undefined,
    weightKg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
    birthDate: row.birth_date ?? undefined,
    memo: row.memo ?? undefined,
    email: row.email ?? undefined,
    linkedUserId: row.linked_user_id ?? undefined,
    profileAccess: row.profile_access as GymMember['profileAccess'],
    isSelf: row.is_self,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileRequest(row: GymMemberProfileRequestRow): GymMemberProfileRequest {
  return {
    id: row.id,
    memberId: row.member_id,
    gymId: row.gym_id,
    gymName: row.gym_name?.trim() || undefined,
    ownerUserId: row.owner_user_id,
    targetUserId: row.target_user_id,
    status: row.status as GymMemberProfileRequest['status'],
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

export const gymMemberRepository = {
  async listByGym(ownerUserId: string, gymId: string): Promise<GymMember[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<GymMemberRow>(
      `SELECT id, gym_id, owner_user_id, name, gender, height_cm, weight_kg, birth_date, memo,
              email, linked_user_id, profile_access, is_self, created_at, updated_at
       FROM gym_members WHERE gym_id = $1 AND owner_user_id = $2 ORDER BY created_at ASC`,
      [gymId, ownerUserId]
    );
    return result.rows.map(mapMember);
  },

  async findById(id: string): Promise<GymMember | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<GymMemberRow>(
      `SELECT id, gym_id, owner_user_id, name, gender, height_cm, weight_kg, birth_date, memo,
              email, linked_user_id, profile_access, is_self, created_at, updated_at
       FROM gym_members WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapMember(result.rows[0]) : null;
  },

  async findSelfMember(gymId: string, ownerUserId: string): Promise<GymMember | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<GymMemberRow>(
      `SELECT id, gym_id, owner_user_id, name, gender, height_cm, weight_kg, birth_date, memo,
              email, linked_user_id, profile_access, is_self, created_at, updated_at
       FROM gym_members WHERE gym_id = $1 AND owner_user_id = $2 AND is_self = TRUE`,
      [gymId, ownerUserId]
    );
    return result.rows[0] ? mapMember(result.rows[0]) : null;
  },

  async create(data: {
    gymId: string;
    ownerUserId: string;
    name: string;
    gender?: string;
    heightCm?: number;
    weightKg?: number;
    birthDate?: string;
    memo?: string;
    email?: string;
    linkedUserId?: string;
    profileAccess?: string;
    isSelf?: boolean;
  }): Promise<GymMember> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<GymMemberRow>(
      `INSERT INTO gym_members (gym_id, owner_user_id, name, gender, height_cm, weight_kg,
         birth_date, memo, email, linked_user_id, profile_access, is_self)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.gymId,
        data.ownerUserId,
        data.name,
        data.gender ?? null,
        data.heightCm ?? null,
        data.weightKg ?? null,
        data.birthDate ?? null,
        data.memo ?? null,
        data.email ?? null,
        data.linkedUserId ?? null,
        data.profileAccess ?? 'none',
        data.isSelf ?? false,
      ]
    );
    const created = result.rows[0];
    if (!created) throw new Error('Failed to create gym member');
    return mapMember(created);
  },

  async update(
    id: string,
    data: {
      name?: string;
      gender?: string | null;
      heightCm?: number | null;
      weightKg?: number | null;
      birthDate?: string | null;
      memo?: string | null;
      email?: string | null;
      profileAccess?: string;
    }
  ): Promise<GymMember | null> {
    const pool = getPool();
    if (!pool) return null;

    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (data.name !== undefined) { fields.push(`name = $${index++}`); values.push(data.name); }
    if ('gender' in data) { fields.push(`gender = $${index++}`); values.push(data.gender ?? null); }
    if ('heightCm' in data) { fields.push(`height_cm = $${index++}`); values.push(data.heightCm ?? null); }
    if ('weightKg' in data) { fields.push(`weight_kg = $${index++}`); values.push(data.weightKg ?? null); }
    if ('birthDate' in data) { fields.push(`birth_date = $${index++}`); values.push(data.birthDate ?? null); }
    if ('memo' in data) { fields.push(`memo = $${index++}`); values.push(data.memo ?? null); }
    if ('email' in data) { fields.push(`email = $${index++}`); values.push(data.email ?? null); }
    if (data.profileAccess !== undefined) { fields.push(`profile_access = $${index++}`); values.push(data.profileAccess); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query<GymMemberRow>(
      `UPDATE gym_members SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`,
      values
    );
    return result.rows[0] ? mapMember(result.rows[0]) : null;
  },

  async remove(id: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const result = await pool.query(`DELETE FROM gym_members WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async ensureSelfMember(gymId: string, ownerUserId: string): Promise<GymMember> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const existing = await this.findSelfMember(gymId, ownerUserId);
    if (existing) return existing;

    const userResult = await pool.query<{
      display_name: string;
      gender: string | null;
      height_cm: string | null;
      weight_kg: string | null;
      email: string;
    }>(`SELECT display_name, gender, height_cm, weight_kg, email FROM users WHERE id = $1`, [
      ownerUserId,
    ]);
    const user = userResult.rows[0];
    if (!user) throw new Error('User not found');

    return this.create({
      gymId,
      ownerUserId,
      name: user.display_name?.trim() || '나',
      gender: user.gender ?? undefined,
      heightCm: user.height_cm ? parseFloat(user.height_cm) : undefined,
      weightKg: user.weight_kg ? parseFloat(user.weight_kg) : undefined,
      email: user.email,
      linkedUserId: ownerUserId,
      profileAccess: 'approved',
      isSelf: true,
    });
  },

  async createProfileRequest(data: {
    memberId: string;
    gymId: string;
    ownerUserId: string;
    targetUserId: string;
  }): Promise<GymMemberProfileRequest> {
    const pool = getPool();
    if (!pool) throw new Error('Database not configured');

    const result = await pool.query<GymMemberProfileRequestRow>(
      `INSERT INTO gym_member_profile_requests (member_id, gym_id, owner_user_id, target_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.memberId, data.gymId, data.ownerUserId, data.targetUserId]
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to create profile request');
    return mapProfileRequest(row);
  },

  async listPendingProfileRequestsForUser(
    targetUserId: string
  ): Promise<GymMemberProfileRequest[]> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<GymMemberProfileRequestRow>(
      `SELECT r.*, ug.name AS gym_name
       FROM gym_member_profile_requests r
       LEFT JOIN user_gyms ug ON ug.id = r.gym_id
       WHERE r.target_user_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [targetUserId]
    );
    return result.rows.map(mapProfileRequest);
  },

  async findProfileRequestById(id: string): Promise<GymMemberProfileRequest | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<GymMemberProfileRequestRow>(
      `SELECT id, member_id, gym_id, owner_user_id, target_user_id, status, created_at, responded_at
       FROM gym_member_profile_requests WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? mapProfileRequest(result.rows[0]) : null;
  },

  async respondToProfileRequest(
    id: string,
    status: 'approved' | 'denied'
  ): Promise<GymMemberProfileRequest | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<GymMemberProfileRequestRow>(
      `UPDATE gym_member_profile_requests SET status = $1, responded_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] ? mapProfileRequest(result.rows[0]) : null;
  },

  async findLinkedUser(gymId: string, linkedUserId: string): Promise<GymMember | null> {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.query<GymMemberRow>(
      `SELECT id, gym_id, owner_user_id, name, gender, height_cm, weight_kg, birth_date, memo,
              email, linked_user_id, profile_access, is_self, created_at, updated_at
       FROM gym_members WHERE gym_id = $1 AND linked_user_id = $2`,
      [gymId, linkedUserId]
    );
    return result.rows[0] ? mapMember(result.rows[0]) : null;
  },

  /**
   * Members the viewer owns that are approved-linked to another account.
   */
  async listApprovedLinkedPeersOwnedBy(
    ownerUserId: string
  ): Promise<Array<{ id: string; gymId: string; linkedUserId: string; isSelf: boolean }>> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      gym_id: string;
      linked_user_id: string;
      is_self: boolean;
    }>(
      `SELECT id, gym_id, linked_user_id, is_self
       FROM gym_members
       WHERE owner_user_id = $1
         AND is_self = FALSE
         AND profile_access = 'approved'
         AND linked_user_id IS NOT NULL
         AND linked_user_id IS DISTINCT FROM owner_user_id`,
      [ownerUserId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      linkedUserId: row.linked_user_id,
      isSelf: row.is_self,
    }));
  },

  /**
   * Member profiles (owned by someone else) where this user is the approved linked account.
   */
  async listApprovedMembersLinkedToUser(
    linkedUserId: string
  ): Promise<Array<{ id: string; gymId: string; ownerUserId: string }>> {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.query<{
      id: string;
      gym_id: string;
      owner_user_id: string;
    }>(
      `SELECT id, gym_id, owner_user_id
       FROM gym_members
       WHERE linked_user_id = $1
         AND is_self = FALSE
         AND profile_access = 'approved'
         AND owner_user_id IS DISTINCT FROM linked_user_id`,
      [linkedUserId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      gymId: row.gym_id,
      ownerUserId: row.owner_user_id,
    }));
  },

  /**
   * Record visibility for approved profile links (linked-member scoped):
   * - Owner A viewing linked member M → include B's own records
   * - Linked user B viewing self → include records A wrote on M
   * Do NOT merge peer records into A's own self view.
   */
  async resolveLinkedRecordListScope(
    viewerUserId: string,
    memberId?: string
  ): Promise<{ peerUserIds: string[]; linkedMemberIds: string[] }> {
    const peerUserIds = new Set<string>();
    const linkedMemberIds = new Set<string>();

    if (memberId) {
      const member = await this.findById(memberId);
      if (!member || member.ownerUserId !== viewerUserId) {
        return { peerUserIds: [], linkedMemberIds: [] };
      }

      // A viewing approved linked member M → include that peer account's records.
      if (
        !member.isSelf &&
        member.profileAccess === 'approved' &&
        member.linkedUserId &&
        member.linkedUserId !== viewerUserId
      ) {
        peerUserIds.add(member.linkedUserId);
      }

      // B viewing self → include logs/history written on profiles linked to B.
      if (member.isSelf) {
        const linkedToMe = await this.listApprovedMembersLinkedToUser(viewerUserId);
        for (const row of linkedToMe) linkedMemberIds.add(row.id);
      }

      return {
        peerUserIds: [...peerUserIds],
        linkedMemberIds: [...linkedMemberIds],
      };
    }

    // Unscoped lists: only surface records written on profiles linked to the viewer.
    const linkedToMe = await this.listApprovedMembersLinkedToUser(viewerUserId);
    for (const row of linkedToMe) linkedMemberIds.add(row.id);

    return {
      peerUserIds: [...peerUserIds],
      linkedMemberIds: [...linkedMemberIds],
    };
  },
};
