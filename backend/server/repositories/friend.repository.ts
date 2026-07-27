import type {
  BlockedUserItem,
  FriendActivityItem,
  FriendAdminStats,
  FriendInviteInfo,
  FriendListItem,
  FriendPrivacySettings,
  FriendProfile,
  FriendRankingMetric,
  FriendRankingRow,
  FriendRelationship,
  FriendRequestItem,
  FriendSort,
  FriendUserSummary,
  PrivacyLevel,
} from '@machinefit/shared';
import { ACHIEVEMENT_BY_ID } from '@machinefit/shared';
import { getPool } from '../config/database.js';

const ONLINE_MS = 5 * 60_000;

function iso(v: unknown): string {
  return new Date(String(v)).toISOString();
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function mapUser(row: Record<string, unknown>): FriendUserSummary {
  const last = row.last_login_at ? new Date(String(row.last_login_at)).getTime() : 0;
  const showOnline = row.show_online !== false;
  return {
    id: String(row.id),
    displayName: String(row.display_name ?? ''),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    experienceLevel: row.experience_level ? String(row.experience_level) : null,
    isOnline: showOnline && last > 0 ? Date.now() - last < ONLINE_MS : undefined,
    lastActiveAt: row.last_login_at && showOnline ? iso(row.last_login_at) : null,
  };
}

function mapPrivacy(row: Record<string, unknown>): FriendPrivacySettings {
  return {
    userId: String(row.user_id),
    profileVisibility: row.profile_visibility as PrivacyLevel,
    workoutRecordsVisibility: row.workout_records_visibility as PrivacyLevel,
    workoutReportVisibility: row.workout_report_visibility as PrivacyLevel,
    growthVisibility: row.growth_visibility as PrivacyLevel,
    badgesVisibility: row.badges_visibility as PrivacyLevel,
    achievementsVisibility: row.achievements_visibility as PrivacyLevel,
    gymVisibility: row.gym_visibility as PrivacyLevel,
    onlineStatusVisibility: row.online_status_visibility as PrivacyLevel,
    bio: String(row.bio ?? ''),
    careerText: String(row.career_text ?? ''),
    favoriteMuscleGroup: row.favorite_muscle_group
      ? String(row.favorite_muscle_group)
      : null,
    favoriteMachineCode: row.favorite_machine_code
      ? String(row.favorite_machine_code)
      : null,
    updatedAt: row.updated_at ? iso(row.updated_at) : undefined,
  };
}

function defaultPrivacy(userId: string): FriendPrivacySettings {
  return {
    userId,
    profileVisibility: 'friends',
    workoutRecordsVisibility: 'friends',
    workoutReportVisibility: 'friends',
    growthVisibility: 'friends',
    badgesVisibility: 'friends',
    achievementsVisibility: 'friends',
    gymVisibility: 'friends',
    onlineStatusVisibility: 'friends',
    bio: '',
    careerText: '',
    favoriteMuscleGroup: null,
    favoriteMachineCode: null,
  };
}

export const friendRepository = {
  async ensurePrivacy(userId: string): Promise<FriendPrivacySettings> {
    const pool = getPool();
    if (!pool) return defaultPrivacy(userId);
    await pool.query(
      `INSERT INTO friend_privacy_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    const { rows } = await pool.query(
      `SELECT * FROM friend_privacy_settings WHERE user_id = $1`,
      [userId]
    );
    return rows[0] ? mapPrivacy(rows[0]) : defaultPrivacy(userId);
  },

  async updatePrivacy(
    userId: string,
    patch: Partial<FriendPrivacySettings>
  ): Promise<FriendPrivacySettings> {
    const pool = getPool()!;
    const cur = await this.ensurePrivacy(userId);
    const next = { ...cur, ...patch };
    const { rows } = await pool.query(
      `UPDATE friend_privacy_settings SET
         profile_visibility = $2,
         workout_records_visibility = $3,
         workout_report_visibility = $4,
         growth_visibility = $5,
         badges_visibility = $6,
         achievements_visibility = $7,
         gym_visibility = $8,
         online_status_visibility = $9,
         bio = $10,
         career_text = $11,
         favorite_muscle_group = $12,
         favorite_machine_code = $13,
         updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        next.profileVisibility,
        next.workoutRecordsVisibility,
        next.workoutReportVisibility,
        next.growthVisibility,
        next.badgesVisibility,
        next.achievementsVisibility,
        next.gymVisibility,
        next.onlineStatusVisibility,
        next.bio,
        next.careerText,
        next.favoriteMuscleGroup ?? null,
        next.favoriteMachineCode ?? null,
      ]
    );
    return mapPrivacy(rows[0]);
  },

  async isBlockedEither(a: string, b: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const { rows } = await pool.query(
      `SELECT 1 FROM blocked_users
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [a, b]
    );
    return Boolean(rows[0]);
  },

  async areFriends(a: string, b: string): Promise<boolean> {
    const pool = getPool();
    if (!pool) return false;
    const [low, high] = orderedPair(a, b);
    const { rows } = await pool.query(
      `SELECT 1 FROM friendships
       WHERE user_low_id = $1 AND user_high_id = $2 AND status = 'ACCEPTED'
       LIMIT 1`,
      [low, high]
    );
    return Boolean(rows[0]);
  },

  async listFriends(
    userId: string,
    options: { q?: string; sort: FriendSort; page: number; limit: number }
  ): Promise<{ items: FriendListItem[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };

    const params: unknown[] = [userId];
    let i = 2;
    let qFilter = '';
    if (options.q?.trim()) {
      qFilter = `AND (u.display_name ILIKE $${i} OR u.email ILIKE $${i} OR u.id::text ILIKE $${i})`;
      params.push(`%${options.q.trim()}%`);
      i += 1;
    }

    const order =
      options.sort === 'recent_activity'
        ? `u.last_login_at DESC NULLS LAST, u.display_name ASC`
        : options.sort === 'friended_at'
          ? `f.created_at DESC`
          : `pinned DESC, u.display_name ASC`;

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_low_id = $1 THEN f.user_high_id ELSE f.user_low_id END
       LEFT JOIN friend_privacy_settings p ON p.user_id = u.id
       WHERE (f.user_low_id = $1 OR f.user_high_id = $1)
         AND u.is_active = TRUE
         ${qFilter}`,
      params
    );

    const offset = (options.page - 1) * options.limit;
    params.push(options.limit, offset);
    const { rows } = await pool.query(
      `SELECT f.id AS friendship_id, f.created_at AS friended_at,
              CASE WHEN f.user_low_id = $1 THEN f.pinned_by_low ELSE f.pinned_by_high END AS pinned,
              u.id, u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
              COALESCE(p.online_status_visibility, 'friends') AS online_vis
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.user_low_id = $1 THEN f.user_high_id ELSE f.user_low_id END
       LEFT JOIN friend_privacy_settings p ON p.user_id = u.id
       WHERE (f.user_low_id = $1 OR f.user_high_id = $1)
         AND u.is_active = TRUE
         ${qFilter}
       ORDER BY ${order}
       LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    const items: FriendListItem[] = rows.map((r) => {
      const canSeeOnline =
        r.online_vis === 'public' || r.online_vis === 'friends';
      const user = mapUser({ ...r, show_online: canSeeOnline });
      return {
        ...user,
        friendshipId: String(r.friendship_id),
        friendedAt: iso(r.friended_at),
        pinned: Boolean(r.pinned),
      };
    });

    // pin sort for name already includes pinned DESC; for other sorts, move pins up in JS
    if (options.sort !== 'name') {
      items.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }

    return { items, total: countRes.rows[0]?.c ?? 0 };
  },

  async searchUsers(
    viewerId: string,
    q: string,
    page: number,
    limit: number
  ): Promise<{ items: FriendUserSummary[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const like = `%${q.trim()}%`;
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.is_active = TRUE
         AND u.id <> $1
         AND r.code <> 'guest'
         AND (u.display_name ILIKE $2 OR u.email ILIKE $2 OR u.id::text ILIKE $2)
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
              OR (b.blocker_id = u.id AND b.blocked_id = $1)
         )`,
      [viewerId, like]
    );
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT u.id, u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
              COALESCE(p.online_status_visibility, 'friends') AS online_vis,
              EXISTS (
                SELECT 1 FROM friendships f
                WHERE (f.user_low_id = $1 AND f.user_high_id = u.id)
                   OR (f.user_high_id = $1 AND f.user_low_id = u.id)
              ) AS is_friend,
              (
                SELECT fr.id::text FROM friend_requests fr
                WHERE fr.status = 'REQUESTED'
                  AND fr.from_user_id = $1 AND fr.to_user_id = u.id
                LIMIT 1
              ) AS outgoing_request_id,
              (
                SELECT fr.id::text FROM friend_requests fr
                WHERE fr.status = 'REQUESTED'
                  AND fr.from_user_id = u.id AND fr.to_user_id = $1
                LIMIT 1
              ) AS incoming_request_id
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN friend_privacy_settings p ON p.user_id = u.id
       WHERE u.is_active = TRUE
         AND u.id <> $1
         AND r.code <> 'guest'
         AND (u.display_name ILIKE $2 OR u.email ILIKE $2 OR u.id::text ILIKE $2)
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
              OR (b.blocker_id = u.id AND b.blocked_id = $1)
         )
       ORDER BY u.display_name ASC
       LIMIT $3 OFFSET $4`,
      [viewerId, like, limit, offset]
    );
    return {
      items: rows.map((r) => {
        const base = mapUser({
          ...r,
          show_online: r.online_vis === 'public',
        });
        let relationship: Exclude<FriendRelationship, 'self'> = 'none';
        let pendingRequestId: string | null = null;
        if (r.is_friend) {
          relationship = 'friend';
        } else if (r.incoming_request_id) {
          relationship = 'incoming';
          pendingRequestId = String(r.incoming_request_id);
        } else if (r.outgoing_request_id) {
          relationship = 'outgoing';
          pendingRequestId = String(r.outgoing_request_id);
        }
        return { ...base, relationship, pendingRequestId };
      }),
      total: countRes.rows[0]?.c ?? 0,
    };
  },

  async createRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<FriendRequestItem> {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO friend_requests (from_user_id, to_user_id, status, message)
       VALUES ($1,$2,'REQUESTED',$3)
       RETURNING *`,
      [fromUserId, toUserId, message]
    );
    return this.getRequestById(String(rows[0].id)) as Promise<FriendRequestItem>;
  },

  async getRequestById(id: string): Promise<FriendRequestItem | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT req.*,
              fu.id AS from_id, fu.display_name AS from_name, fu.avatar_url AS from_avatar,
              fu.experience_level AS from_level, fu.last_login_at AS from_last,
              tu.id AS to_id, tu.display_name AS to_name, tu.avatar_url AS to_avatar,
              tu.experience_level AS to_level, tu.last_login_at AS to_last
       FROM friend_requests req
       JOIN users fu ON fu.id = req.from_user_id
       JOIN users tu ON tu.id = req.to_user_id
       WHERE req.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      fromUser: mapUser({
        id: r.from_id,
        display_name: r.from_name,
        avatar_url: r.from_avatar,
        experience_level: r.from_level,
        last_login_at: r.from_last,
        show_online: false,
      }),
      toUser: mapUser({
        id: r.to_id,
        display_name: r.to_name,
        avatar_url: r.to_avatar,
        experience_level: r.to_level,
        last_login_at: r.to_last,
        show_online: false,
      }),
      status: r.status,
      message: String(r.message ?? ''),
      createdAt: iso(r.created_at),
      respondedAt: r.responded_at ? iso(r.responded_at) : null,
    };
  },

  async listRequests(
    userId: string,
    direction: 'incoming' | 'outgoing',
    page: number,
    limit: number
  ): Promise<{ items: FriendRequestItem[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const col = direction === 'incoming' ? 'to_user_id' : 'from_user_id';
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM friend_requests
       WHERE ${col} = $1 AND status = 'REQUESTED'`,
      [userId]
    );
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT req.*,
              fu.id AS from_id, fu.display_name AS from_name, fu.avatar_url AS from_avatar,
              fu.experience_level AS from_level, fu.last_login_at AS from_last,
              tu.id AS to_id, tu.display_name AS to_name, tu.avatar_url AS to_avatar,
              tu.experience_level AS to_level, tu.last_login_at AS to_last
       FROM friend_requests req
       JOIN users fu ON fu.id = req.from_user_id
       JOIN users tu ON tu.id = req.to_user_id
       WHERE req.${col} = $1 AND req.status = 'REQUESTED'
       ORDER BY req.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const items: FriendRequestItem[] = rows.map((r) => ({
      id: String(r.id),
      fromUser: mapUser({
        id: r.from_id,
        display_name: r.from_name,
        avatar_url: r.from_avatar,
        experience_level: r.from_level,
        last_login_at: r.from_last,
        show_online: false,
      }),
      toUser: mapUser({
        id: r.to_id,
        display_name: r.to_name,
        avatar_url: r.to_avatar,
        experience_level: r.to_level,
        last_login_at: r.to_last,
        show_online: false,
      }),
      status: r.status,
      message: String(r.message ?? ''),
      createdAt: iso(r.created_at),
      respondedAt: r.responded_at ? iso(r.responded_at) : null,
    }));
    return { items, total: countRes.rows[0]?.c ?? 0 };
  },

  async setRequestStatus(
    id: string,
    status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  ): Promise<void> {
    const pool = getPool()!;
    await pool.query(
      `UPDATE friend_requests SET status = $2, responded_at = NOW() WHERE id = $1`,
      [id, status]
    );
  },

  async createFriendship(a: string, b: string): Promise<void> {
    const pool = getPool()!;
    const [low, high] = orderedPair(a, b);
    await pool.query(
      `INSERT INTO friendships (user_low_id, user_high_id, status)
       VALUES ($1,$2,'ACCEPTED')
       ON CONFLICT (user_low_id, user_high_id) DO NOTHING`,
      [low, high]
    );
  },

  async deleteFriendship(a: string, b: string): Promise<boolean> {
    const pool = getPool()!;
    const [low, high] = orderedPair(a, b);
    const { rowCount } = await pool.query(
      `DELETE FROM friendships WHERE user_low_id = $1 AND user_high_id = $2`,
      [low, high]
    );
    return (rowCount ?? 0) > 0;
  },

  async setPinned(userId: string, friendId: string, pinned: boolean): Promise<void> {
    const pool = getPool()!;
    const [low, high] = orderedPair(userId, friendId);
    const col = userId === low ? 'pinned_by_low' : 'pinned_by_high';
    await pool.query(
      `UPDATE friendships SET ${col} = $3, updated_at = NOW()
       WHERE user_low_id = $1 AND user_high_id = $2`,
      [low, high, pinned]
    );
  },

  async blockUser(blockerId: string, blockedId: string, reason: string): Promise<void> {
    const pool = getPool()!;
    await pool.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id, reason)
       VALUES ($1,$2,$3)
       ON CONFLICT (blocker_id, blocked_id) DO UPDATE SET reason = EXCLUDED.reason`,
      [blockerId, blockedId, reason]
    );
    await this.deleteFriendship(blockerId, blockedId);
    await pool.query(
      `UPDATE friend_requests SET status = 'CANCELLED', responded_at = NOW()
       WHERE status = 'REQUESTED'
         AND ((from_user_id = $1 AND to_user_id = $2)
           OR (from_user_id = $2 AND to_user_id = $1))`,
      [blockerId, blockedId]
    );
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    const pool = getPool()!;
    const { rowCount } = await pool.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [blockerId, blockedId]
    );
    return (rowCount ?? 0) > 0;
  },

  async listBlocked(
    blockerId: string,
    page: number,
    limit: number
  ): Promise<{ items: BlockedUserItem[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c FROM blocked_users WHERE blocker_id = $1`,
      [blockerId]
    );
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT b.id, b.reason, b.created_at,
              u.id AS uid, u.display_name, u.avatar_url, u.experience_level, u.last_login_at
       FROM blocked_users b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [blockerId, limit, offset]
    );
    return {
      items: rows.map((r) => ({
        id: String(r.id),
        reason: String(r.reason ?? ''),
        createdAt: iso(r.created_at),
        user: mapUser({
          id: r.uid,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          experience_level: r.experience_level,
          last_login_at: r.last_login_at,
          show_online: false,
        }),
      })),
      total: countRes.rows[0]?.c ?? 0,
    };
  },

  async getProfile(
    viewerId: string,
    targetId: string
  ): Promise<FriendProfile | null> {
    const pool = getPool();
    if (!pool) return null;
    const userRes = await pool.query(
      `SELECT u.id, u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
              u.home_gym_name
       FROM users u WHERE u.id = $1 AND u.is_active = TRUE`,
      [targetId]
    );
    if (!userRes.rows[0]) return null;

    const privacy = await this.ensurePrivacy(targetId);
    const isSelf = viewerId === targetId;
    const friends = isSelf ? true : await this.areFriends(viewerId, targetId);
    const blocked = isSelf ? false : await this.isBlockedEither(viewerId, targetId);

    let relationship: FriendProfile['relationship'] = 'none';
    let pendingRequestId: string | null = null;
    if (isSelf) relationship = 'self';
    else if (blocked) relationship = 'blocked';
    else if (friends) relationship = 'friend';
    else {
      const req = await pool.query(
        `SELECT id, from_user_id, to_user_id FROM friend_requests
         WHERE status = 'REQUESTED'
           AND ((from_user_id = $1 AND to_user_id = $2)
             OR (from_user_id = $2 AND to_user_id = $1))
         LIMIT 1`,
        [viewerId, targetId]
      );
      if (req.rows[0]) {
        relationship =
          req.rows[0].from_user_id === viewerId ? 'outgoing' : 'incoming';
        pendingRequestId = String(req.rows[0].id);
      }
    }

    const can = (level: PrivacyLevel) => {
      if (isSelf) return true;
      if (level === 'public') return true;
      if (level === 'friends') return friends;
      return false;
    };

    const showOnline = can(privacy.onlineStatusVisibility);
    const canSeeIdentity = can(privacy.profileVisibility);
    const profile: FriendProfile = {
      user: mapUser({
        ...userRes.rows[0],
        // Redact name/avatar when profile is private/friends-only to strangers
        // (was an IDOR: UUID in URL always leaked display_name + avatar_url).
        display_name: canSeeIdentity ? userRes.rows[0].display_name : '',
        avatar_url: canSeeIdentity ? userRes.rows[0].avatar_url : null,
        experience_level: canSeeIdentity ? userRes.rows[0].experience_level : null,
        last_login_at: canSeeIdentity ? userRes.rows[0].last_login_at : null,
        show_online: canSeeIdentity && showOnline,
      }),
      identityHidden: !canSeeIdentity,
      relationship,
      pendingRequestId,
      canMessage: friends,
    };

    if (canSeeIdentity) {
      profile.bio = privacy.bio;
      profile.careerText = privacy.careerText;
      profile.experienceLevel = userRes.rows[0].experience_level;
      profile.favoriteMuscleGroup = privacy.favoriteMuscleGroup;
      profile.favoriteMachineCode = privacy.favoriteMachineCode;
    }
    if (can(privacy.gymVisibility)) {
      profile.gymName = userRes.rows[0].home_gym_name ?? null;
    }

    if (can(privacy.workoutRecordsVisibility)) {
      try {
        const logs = await pool.query(
          `SELECT wl.log_date, m.code AS machine_code
           FROM workout_logs wl
           LEFT JOIN machines m ON m.id = wl.machine_id
           WHERE wl.user_id = $1
           ORDER BY wl.log_date DESC, wl.created_at DESC
           LIMIT 10`,
          [targetId]
        );
        profile.recentWorkouts = logs.rows.map((r) => ({
          date: String(r.log_date),
          machineCode: r.machine_code ? String(r.machine_code) : null,
        }));
      } catch {
        profile.recentWorkouts = [];
      }
    }

    if (can(privacy.achievementsVisibility) || can(privacy.badgesVisibility)) {
      try {
        const badges = await pool.query(
          `SELECT achievement_id
           FROM user_achievements
           WHERE user_id = $1
           ORDER BY earned_at DESC NULLS LAST
           LIMIT 12`,
          [targetId]
        );
        const mapped = badges.rows.map((r) => {
          const id = String(r.achievement_id ?? '');
          const def = ACHIEVEMENT_BY_ID[id];
          return {
            code: id,
            title: def?.title?.ko || def?.title?.en || id,
          };
        });
        if (can(privacy.badgesVisibility)) profile.badges = mapped;
        if (can(privacy.achievementsVisibility)) profile.achievements = mapped;
      } catch {
        /* table may differ */
      }
    }

    if (can(privacy.growthVisibility)) {
      try {
        const stats = await pool.query(
          `SELECT session_days, current_streak, longest_streak, workout_count,
                  total_volume_kg, unique_machines, level, total_xp
           FROM user_achievement_stats WHERE user_id = $1`,
          [targetId]
        );
        const s = stats.rows[0];
        profile.growthStats = s
          ? {
              sessionDays: Number(s.session_days) || 0,
              currentStreak: Number(s.current_streak) || 0,
              longestStreak: Number(s.longest_streak) || 0,
              workoutCount: Number(s.workout_count) || 0,
              totalVolumeKg: Number(s.total_volume_kg) || 0,
              uniqueMachines: Number(s.unique_machines) || 0,
              level: Number(s.level) || 1,
              totalXp: Number(s.total_xp) || 0,
            }
          : { sessionDays: 0, currentStreak: 0, workoutCount: 0 };
      } catch {
        profile.growthStats = { sessionDays: 0, currentStreak: 0, workoutCount: 0 };
      }
    }

    return profile;
  },

  async listFeed(
    viewerId: string,
    page: number,
    limit: number
  ): Promise<{ items: FriendActivityItem[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const offset = (page - 1) * limit;
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM friend_activity_logs a
       WHERE a.visibility IN ('public','friends')
         AND (
           a.actor_id = $1
           OR EXISTS (
             SELECT 1 FROM friendships f
             WHERE (f.user_low_id = $1 AND f.user_high_id = a.actor_id)
                OR (f.user_high_id = $1 AND f.user_low_id = a.actor_id)
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE (b.blocker_id = $1 AND b.blocked_id = a.actor_id)
              OR (b.blocker_id = a.actor_id AND b.blocked_id = $1)
         )`,
      [viewerId]
    );
    const { rows } = await pool.query(
      `SELECT a.*, u.display_name, u.avatar_url, u.experience_level, u.last_login_at
       FROM friend_activity_logs a
       JOIN users u ON u.id = a.actor_id
       WHERE a.visibility IN ('public','friends')
         AND (
           a.actor_id = $1
           OR EXISTS (
             SELECT 1 FROM friendships f
             WHERE (f.user_low_id = $1 AND f.user_high_id = a.actor_id)
                OR (f.user_high_id = $1 AND f.user_low_id = a.actor_id)
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE (b.blocker_id = $1 AND b.blocked_id = a.actor_id)
              OR (b.blocker_id = a.actor_id AND b.blocked_id = $1)
         )
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [viewerId, limit, offset]
    );
    return {
      items: rows.map((r) => ({
        id: String(r.id),
        actor: mapUser({
          id: r.actor_id,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          experience_level: r.experience_level,
          last_login_at: r.last_login_at,
          show_online: false,
        }),
        activityType: String(r.activity_type),
        title: String(r.title ?? ''),
        body: String(r.body ?? ''),
        payload: (r.payload as Record<string, unknown>) ?? {},
        createdAt: iso(r.created_at),
      })),
      total: countRes.rows[0]?.c ?? 0,
    };
  },

  async addActivity(input: {
    actorId: string;
    activityType: string;
    title: string;
    body?: string;
    payload?: Record<string, unknown>;
    visibility?: PrivacyLevel;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO friend_activity_logs (actor_id, activity_type, title, body, payload, visibility)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)`,
      [
        input.actorId,
        input.activityType,
        input.title,
        input.body ?? '',
        JSON.stringify(input.payload ?? {}),
        input.visibility ?? 'friends',
      ]
    );
  },

  async rankings(
    viewerId: string,
    metric: FriendRankingMetric,
    page: number,
    limit: number
  ): Promise<{ items: FriendRankingRow[]; total: number }> {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };

    const friends = await pool.query(
      `SELECT CASE WHEN user_low_id = $1 THEN user_high_id ELSE user_low_id END AS fid
       FROM friendships WHERE user_low_id = $1 OR user_high_id = $1`,
      [viewerId]
    );
    const ids = [viewerId, ...friends.rows.map((r) => String(r.fid))];

    /** Visible to viewer when own row or workout records not private. */
    const visible = `(
      u.id = $2
      OR COALESCE(p.workout_records_visibility, 'friends') IN ('public', 'friends')
    )`;

    let valueSql = `COUNT(wl.id) FILTER (WHERE wl.id IS NOT NULL AND ${visible})::int`;
    let logDateFilter = '';
    let useStreakStats = false;
    let useVolume = false;

    if (metric === 'weekly_workouts') {
      logDateFilter = `AND wl.log_date >= (CURRENT_DATE - INTERVAL '7 days')`;
    } else if (metric === 'monthly_workouts') {
      logDateFilter = `AND wl.log_date >= (CURRENT_DATE - INTERVAL '30 days')`;
    } else if (metric === 'total_duration') {
      // No duration column — distinct session days (i18n: workout days)
      valueSql = `COUNT(DISTINCT wl.log_date) FILTER (
        WHERE wl.log_date IS NOT NULL AND ${visible}
      )::int`;
    } else if (metric === 'total_volume') {
      useVolume = true;
      valueSql = `COALESCE(SUM(CASE WHEN ${visible} THEN vol.kg ELSE 0 END), 0)::int`;
    } else if (metric === 'machine_variety') {
      valueSql = `COUNT(DISTINCT wl.machine_id) FILTER (
        WHERE wl.machine_id IS NOT NULL AND ${visible}
      )::int`;
    } else if (metric === 'streak_days') {
      useStreakStats = true;
      valueSql = `CASE WHEN ${visible} THEN COALESCE(s.current_streak, 0) ELSE 0 END`;
    }

    try {
      const sql = useStreakStats
        ? `SELECT u.id, u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
                  ${valueSql} AS value
           FROM users u
           LEFT JOIN user_achievement_stats s ON s.user_id = u.id
           LEFT JOIN friend_privacy_settings p ON p.user_id = u.id
           WHERE u.id = ANY($1::uuid[])
           ORDER BY value DESC, u.display_name ASC`
        : `SELECT u.id, u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
                  ${valueSql} AS value
           FROM users u
           LEFT JOIN workout_logs wl ON wl.user_id = u.id ${logDateFilter}
           LEFT JOIN friend_privacy_settings p ON p.user_id = u.id
           ${
             useVolume
               ? `LEFT JOIN LATERAL (
                    SELECT COALESCE(SUM(value::numeric), 0) AS kg
                    FROM jsonb_array_elements_text(COALESCE(wl.set_weights_kg, '[]'::jsonb)) AS t(value)
                  ) vol ON TRUE`
               : ''
           }
           WHERE u.id = ANY($1::uuid[])
           GROUP BY u.id, p.workout_records_visibility
           ORDER BY value DESC, u.display_name ASC`;

      const { rows } = await pool.query(sql, [ids, viewerId]);
      const ranked = rows.map((r, idx) => ({
        user: mapUser({ ...r, show_online: false }),
        value: Number(r.value) || 0,
        rank: idx + 1,
      }));
      const offset = (page - 1) * limit;
      return {
        items: ranked.slice(offset, offset + limit),
        total: ranked.length,
      };
    } catch {
      const users = await pool.query(
        `SELECT id, display_name, avatar_url, experience_level, last_login_at
         FROM users WHERE id = ANY($1::uuid[]) ORDER BY display_name`,
        [ids]
      );
      const ranked = users.rows.map((r, idx) => ({
        user: mapUser({ ...r, show_online: false }),
        value: 0,
        rank: idx + 1,
      }));
      const offset = (page - 1) * limit;
      return { items: ranked.slice(offset, offset + limit), total: ranked.length };
    }
  },

  async getOrCreateInvite(userId: string, baseUrl: string): Promise<FriendInviteInfo> {
    const pool = getPool()!;
    let { rows } = await pool.query(
      `SELECT * FROM friend_referral_codes WHERE user_id = $1`,
      [userId]
    );
    if (!rows[0]) {
      const code = `MF${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      await pool.query(
        `INSERT INTO friend_referral_codes (user_id, code) VALUES ($1,$2)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, code]
      );
      rows = (
        await pool.query(`SELECT * FROM friend_referral_codes WHERE user_id = $1`, [
          userId,
        ])
      ).rows;
    }
    const code = String(rows[0].code);
    return {
      code,
      shareUrl: `${baseUrl}?ref=${encodeURIComponent(code)}`,
      inviteCount: Number(rows[0].invite_count) || 0,
    };
  },

  async logReferralEvent(input: {
    referrerId: string;
    referredId?: string | null;
    code: string;
    eventType: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const pool = getPool();
    if (!pool) return;
    await pool.query(
      `INSERT INTO friend_referral_events (referrer_id, referred_id, code, event_type, meta)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [
        input.referrerId,
        input.referredId ?? null,
        input.code,
        input.eventType,
        JSON.stringify(input.meta ?? {}),
      ]
    );
  },

  async adminStats(): Promise<FriendAdminStats> {
    const pool = getPool();
    if (!pool) {
      return {
        friendshipCount: 0,
        pendingRequestCount: 0,
        blockCount: 0,
        reportCount: 0,
        spamRequestSuspects: 0,
      };
    }
    const f = await pool.query(`SELECT COUNT(*)::int AS c FROM friendships`);
    const p = await pool.query(
      `SELECT COUNT(*)::int AS c FROM friend_requests WHERE status = 'REQUESTED'`
    );
    const b = await pool.query(`SELECT COUNT(*)::int AS c FROM blocked_users`);
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM friend_reports WHERE status = 'pending'`
    );
    const spam = await pool.query(
      `SELECT COUNT(*)::int AS c FROM (
         SELECT from_user_id FROM friend_requests
         WHERE created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY from_user_id HAVING COUNT(*) >= 20
       ) s`
    );
    return {
      friendshipCount: f.rows[0]?.c ?? 0,
      pendingRequestCount: p.rows[0]?.c ?? 0,
      blockCount: b.rows[0]?.c ?? 0,
      reportCount: r.rows[0]?.c ?? 0,
      spamRequestSuspects: spam.rows[0]?.c ?? 0,
    };
  },

  async adminListFriendships(page: number, limit: number) {
    const pool = getPool();
    if (!pool) return { items: [], total: 0 };
    const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM friendships`);
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT f.*,
              a.display_name AS low_name,
              b.display_name AS high_name
       FROM friendships f
       JOIN users a ON a.id = f.user_low_id
       JOIN users b ON b.id = f.user_high_id
       ORDER BY f.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return {
      items: rows.map((r) => ({
        id: String(r.id),
        userLowId: String(r.user_low_id),
        userHighId: String(r.user_high_id),
        lowName: String(r.low_name),
        highName: String(r.high_name),
        createdAt: iso(r.created_at),
      })),
      total: countRes.rows[0]?.c ?? 0,
    };
  },

  async adminDeleteFriendship(id: string): Promise<boolean> {
    const pool = getPool()!;
    const { rowCount } = await pool.query(`DELETE FROM friendships WHERE id = $1`, [id]);
    return (rowCount ?? 0) > 0;
  },

  async createReport(input: {
    reporterId: string;
    reportedUserId: string;
    reason: string;
    description?: string | null;
  }) {
    const pool = getPool()!;
    const { rows } = await pool.query(
      `INSERT INTO friend_reports (reporter_id, reported_user_id, reason, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [input.reporterId, input.reportedUserId, input.reason, input.description ?? null]
    );
    return rows[0];
  },

  async listReports() {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT * FROM friend_reports ORDER BY created_at DESC LIMIT 100`
    );
    return rows.map((r) => ({
      id: String(r.id),
      reporterId: String(r.reporter_id),
      reportedUserId: String(r.reported_user_id),
      reason: String(r.reason),
      description: r.description ? String(r.description) : null,
      status: String(r.status),
      createdAt: iso(r.created_at),
    }));
  },

  async resolveReport(id: string, status: string, adminId: string) {
    const pool = getPool()!;
    await pool.query(
      `UPDATE friend_reports SET status = $2, resolved_by = $3, resolved_at = NOW()
       WHERE id = $1`,
      [id, status, adminId]
    );
  },

  async findPendingRequest(from: string, to: string) {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT * FROM friend_requests
       WHERE status = 'REQUESTED' AND from_user_id = $1 AND to_user_id = $2
       LIMIT 1`,
      [from, to]
    );
    return rows[0] ?? null;
  },

  async findPendingBetween(a: string, b: string) {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT * FROM friend_requests
       WHERE status = 'REQUESTED'
         AND ((from_user_id = $1 AND to_user_id = $2)
           OR (from_user_id = $2 AND to_user_id = $1))
       LIMIT 1`,
      [a, b]
    );
    return rows[0] ?? null;
  },

  async getUserBrief(userId: string): Promise<FriendUserSummary | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT id, display_name, avatar_url, experience_level, last_login_at
       FROM users WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );
    if (!rows[0]) return null;
    return mapUser({ ...rows[0], show_online: false });
  },

  async applyReferralCode(
    userId: string,
    code: string
  ): Promise<{ referrerId: string; code: string } | null> {
    const pool = getPool();
    if (!pool) return null;
    const { rows } = await pool.query(
      `SELECT user_id, code FROM friend_referral_codes WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    );
    if (!rows[0] || String(rows[0].user_id) === userId) return null;
    const existing = await pool.query(
      `SELECT 1 FROM friend_referral_events
       WHERE referred_id = $1 AND event_type = 'signup_applied' LIMIT 1`,
      [userId]
    );
    if (existing.rows[0]) return null;
    const referrerId = String(rows[0].user_id);
    const normalizedCode = String(rows[0].code);
    await pool.query(
      `INSERT INTO friend_referral_events (referrer_id, referred_id, code, event_type)
       VALUES ($1,$2,$3,'signup_applied')`,
      [referrerId, userId, normalizedCode]
    );
    await pool.query(
      `UPDATE friend_referral_codes SET invite_count = invite_count + 1 WHERE user_id = $1`,
      [referrerId]
    );
    return { referrerId, code: normalizedCode };
  },

  async adminListSpam(limit = 50) {
    const pool = getPool();
    if (!pool) return [];
    const { rows } = await pool.query(
      `SELECT u.id, u.display_name, u.email, COUNT(*)::int AS request_count,
              MAX(fr.created_at) AS last_request_at
       FROM friend_requests fr
       JOIN users u ON u.id = fr.from_user_id
       WHERE fr.created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY u.id
       HAVING COUNT(*) >= 10
       ORDER BY request_count DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map((r) => ({
      userId: String(r.id),
      displayName: String(r.display_name ?? ''),
      email: String(r.email ?? ''),
      requestCount: Number(r.request_count) || 0,
      lastRequestAt: r.last_request_at ? iso(r.last_request_at) : null,
    }));
  },

  /** Synthetic feed from recent friend workouts when activity_logs are sparse. */
  async listSyntheticWorkoutFeed(
    viewerId: string,
    limit: number
  ): Promise<FriendActivityItem[]> {
    const pool = getPool();
    if (!pool) return [];
    try {
      const { rows } = await pool.query(
        `SELECT wl.id, wl.log_date, wl.created_at, wl.user_id AS actor_id,
                u.display_name, u.avatar_url, u.experience_level, u.last_login_at,
                m.code AS machine_code
         FROM workout_logs wl
         JOIN users u ON u.id = wl.user_id
         LEFT JOIN machines m ON m.id = wl.machine_id
         LEFT JOIN friend_privacy_settings p ON p.user_id = wl.user_id
         WHERE (
             wl.user_id = $1
             OR EXISTS (
               SELECT 1 FROM friendships f
               WHERE (f.user_low_id = $1 AND f.user_high_id = wl.user_id)
                  OR (f.user_high_id = $1 AND f.user_low_id = wl.user_id)
             )
           )
           AND COALESCE(p.workout_records_visibility, 'friends') IN ('public', 'friends')
           AND NOT EXISTS (
             SELECT 1 FROM blocked_users b
             WHERE (b.blocker_id = $1 AND b.blocked_id = wl.user_id)
                OR (b.blocker_id = wl.user_id AND b.blocked_id = $1)
           )
         ORDER BY wl.created_at DESC NULLS LAST, wl.log_date DESC
         LIMIT $2`,
        [viewerId, limit]
      );
      return rows.map((r) => ({
        id: `wl-${String(r.id)}`,
        actor: mapUser({
          id: r.actor_id,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          experience_level: r.experience_level,
          last_login_at: r.last_login_at,
          show_online: false,
        }),
        activityType: 'workout_completed',
        title: 'workout_completed',
        body: String(r.machine_code ?? ''),
        payload: {
          logDate: String(r.log_date),
          machineCode: r.machine_code ? String(r.machine_code) : null,
        },
        createdAt: r.created_at ? iso(r.created_at) : iso(r.log_date),
      }));
    } catch {
      return [];
    }
  },
};
