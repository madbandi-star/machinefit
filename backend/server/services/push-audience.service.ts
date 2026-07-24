import {
  Role,
  PUSH_AUDIENCE_TYPES,
  getRoleLevel,
  hasMinRole,
  isRoleCode,
  type PushAudienceInput,
  type PushAudienceType,
  type PushComposeCapabilities,
  type RoleCode,
} from '@machinefit/shared';
import { getPool } from '../config/database.js';
import { findDevUserById, listDevUsers } from '../data/dev-users.js';
import { AppError } from '../middlewares/error.middleware.js';
import { userRepository } from '../repositories/user.repository.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MEMBER_TIER_ROLES: readonly RoleCode[] = [
  Role.MEMBER,
  Role.PREMIUM_MEMBER,
  Role.VIP_MEMBER,
];

export const PUSH_CAPS = {
  admin: 2000,
  owner: 500,
  trainer: 100,
  member: 1,
} as const;

export function isMemberTierRole(role: string | null | undefined): boolean {
  return (
    role === Role.MEMBER ||
    role === Role.PREMIUM_MEMBER ||
    role === Role.VIP_MEMBER
  );
}

/** Staff / elevated roles that trainers must not message. */
export function isStaffOrAbove(role: string | null | undefined): boolean {
  return getRoleLevel(role) >= getRoleLevel(Role.TRAINER);
}

export function getPushComposeMeta(senderRole: RoleCode): {
  canCompose: boolean;
  allowedAudienceTypes: PushAudienceType[];
  maxRecipients: number;
} {
  if (hasMinRole(senderRole, Role.ADMIN)) {
    return {
      canCompose: true,
      allowedAudienceTypes: [...PUSH_AUDIENCE_TYPES],
      maxRecipients: PUSH_CAPS.admin,
    };
  }
  if (hasMinRole(senderRole, Role.OWNER)) {
    return {
      canCompose: true,
      allowedAudienceTypes: [
        'owner_gym_trainers',
        'owner_gym_members',
        'user_ids',
        'gym',
      ],
      maxRecipients: PUSH_CAPS.owner,
    };
  }
  if (hasMinRole(senderRole, Role.TRAINER)) {
    return {
      canCompose: true,
      allowedAudienceTypes: ['trainer_clients', 'user_ids'],
      maxRecipients: PUSH_CAPS.trainer,
    };
  }
  if (isMemberTierRole(senderRole)) {
    return {
      canCompose: true,
      allowedAudienceTypes: ['member_exact'],
      maxRecipients: PUSH_CAPS.member,
    };
  }
  return {
    canCompose: false,
    allowedAudienceTypes: [],
    maxRecipients: 0,
  };
}

export function authorizeAudienceType(
  senderRole: RoleCode,
  audienceType: PushAudienceType
): boolean {
  return getPushComposeMeta(senderRole).allowedAudienceTypes.includes(audienceType);
}

/**
 * Defense-in-depth filter: exclude self, intersect with allowed set when provided,
 * enforce max recipients.
 */
export function filterRecipients(
  senderId: string,
  recipientIds: string[],
  options: {
    allowedIds?: ReadonlySet<string> | null;
    maxRecipients: number;
  }
): { allowed: string[]; skipped: number } {
  const seen = new Set<string>();
  const allowed: string[] = [];
  let skipped = 0;

  for (const id of recipientIds) {
    if (!id || id === senderId) {
      skipped += 1;
      continue;
    }
    if (seen.has(id)) {
      skipped += 1;
      continue;
    }
    if (options.allowedIds && !options.allowedIds.has(id)) {
      skipped += 1;
      continue;
    }
    seen.add(id);
    if (allowed.length >= options.maxRecipients) {
      skipped += 1;
      continue;
    }
    allowed.push(id);
  }

  return { allowed, skipped };
}

/** Pure gate: owner may only target official gyms they own / have active permission on. */
export function ownerMayTargetGym(
  ownedGymIds: readonly string[],
  gymId: string
): boolean {
  return ownedGymIds.includes(gymId);
}

export interface ResolvedAudienceUser {
  id: string;
  displayName: string;
  roleCode: RoleCode;
}

async function loadSenderUser(
  senderId: string
): Promise<{ id: string; displayName: string; roleCode: RoleCode }> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(senderId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'Sender not found');
    }
    const roleCode = isRoleCode(user.roleCode) ? user.roleCode : Role.MEMBER;
    return { id: user.id, displayName: user.displayName, roleCode };
  }

  const dev = findDevUserById(senderId);
  if (!dev || !dev.isActive) {
    throw new AppError(404, 'NOT_FOUND', 'Sender not found');
  }
  return {
    id: dev.id,
    displayName: dev.displayName,
    roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
  };
}

async function listOwnedGymIds(ownerUserId: string): Promise<string[]> {
  const pool = getPool();
  if (!pool) return [];

  const result = await pool.query<{ id: string }>(
    `SELECT g.id
     FROM gyms g
     LEFT JOIN gym_owner_permissions p
       ON p.gym_id = g.id AND p.user_id = $1 AND p.status = 'active'
     WHERE g.owner_id = $1 OR p.id IS NOT NULL`,
    [ownerUserId]
  );
  return result.rows.map((r) => r.id);
}

async function listOwnedGyms(
  ownerUserId: string
): Promise<Array<{ id: string; name: string }>> {
  const pool = getPool();
  if (!pool) return [];

  const result = await pool.query<{ id: string; name: string }>(
    `SELECT g.id, g.name
     FROM gyms g
     LEFT JOIN gym_owner_permissions p
       ON p.gym_id = g.id AND p.user_id = $1 AND p.status = 'active'
     WHERE g.owner_id = $1 OR p.id IS NOT NULL
     ORDER BY g.name ASC`,
    [ownerUserId]
  );
  return result.rows;
}

async function assertOwnsGym(ownerUserId: string, gymId: string): Promise<void> {
  const owned = await listOwnedGymIds(ownerUserId);
  if (!ownerMayTargetGym(owned, gymId)) {
    throw new AppError(403, 'FORBIDDEN', 'You do not own this gym');
  }
}

async function findUsersByIds(ids: string[]): Promise<ResolvedAudienceUser[]> {
  if (ids.length === 0) return [];
  const pool = getPool();
  if (!pool) {
    const users: ResolvedAudienceUser[] = [];
    for (const id of ids) {
      const u = findDevUserById(id);
      if (!u || !u.isActive) continue;
      users.push({
        id: u.id,
        displayName: u.displayName,
        roleCode: isRoleCode(u.roleCode) ? u.roleCode : Role.MEMBER,
      });
    }
    return users;
  }

  const result = await pool.query<{
    id: string;
    display_name: string;
    role_code: string;
  }>(
    `SELECT u.id, u.display_name, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = ANY($1::uuid[]) AND u.is_active = TRUE`,
    [ids]
  );
  return result.rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    roleCode: isRoleCode(r.role_code) ? r.role_code : Role.MEMBER,
  }));
}

async function listActiveUsersByRole(
  roleCode?: RoleCode,
  limit: number = PUSH_CAPS.admin
): Promise<ResolvedAudienceUser[]> {
  const pool = getPool();
  if (!pool) {
    let users = listDevUsers().filter((u) => u.isActive);
    if (roleCode) users = users.filter((u) => u.roleCode === roleCode);
    return users.slice(0, limit).map((u) => ({
      id: u.id,
      displayName: u.displayName,
      roleCode: isRoleCode(u.roleCode) ? u.roleCode : Role.MEMBER,
    }));
  }

  if (roleCode) {
    const result = await pool.query<{
      id: string;
      display_name: string;
      role_code: string;
    }>(
      `SELECT u.id, u.display_name, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.is_active = TRUE AND r.code = $1
       ORDER BY u.created_at DESC
       LIMIT $2`,
      [roleCode, limit]
    );
    return result.rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      roleCode: isRoleCode(r.role_code) ? r.role_code : Role.MEMBER,
    }));
  }

  const result = await pool.query<{
    id: string;
    display_name: string;
    role_code: string;
  }>(
    `SELECT u.id, u.display_name, r.code AS role_code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.is_active = TRUE
     ORDER BY u.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    roleCode: isRoleCode(r.role_code) ? r.role_code : Role.MEMBER,
  }));
}

/**
 * Owner gym-scoped users:
 * (a) home_gym_id IN owned gyms + role filter
 * (b) gym_members linked_user_id (approved, not self) owned by sender + role filter
 */
async function resolveOwnerGymScopedUsers(
  senderId: string,
  gymIds: string[],
  roleFilter: 'member_tier' | 'trainer' | RoleCode | null,
  limit: number,
  options?: { requireOwnerLink?: boolean; scopeLinkedToGyms?: boolean }
): Promise<ResolvedAudienceUser[]> {
  const pool = getPool();
  if (!pool) return [];

  const requireOwnerLink = options?.requireOwnerLink !== false;
  const scopeLinkedToGyms = options?.scopeLinkedToGyms !== false;

  // Need at least one gym for home_gym branch, or owner-link branch without gym scope
  if (gymIds.length === 0 && !(requireOwnerLink && !scopeLinkedToGyms)) {
    return [];
  }

  const roleCodes: string[] | null =
    roleFilter === 'member_tier'
      ? [...MEMBER_TIER_ROLES]
      : roleFilter === 'trainer'
        ? [Role.TRAINER]
        : roleFilter
          ? [roleFilter]
          : null;

  const result = await pool.query<{
    id: string;
    display_name: string;
    role_code: string;
  }>(
    `WITH scoped AS (
       SELECT u.id, u.display_name, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE cardinality($1::uuid[]) > 0
         AND u.is_active = TRUE
         AND u.home_gym_id = ANY($1::uuid[])
         AND u.id <> $2
         AND ($3::text[] IS NULL OR r.code = ANY($3::text[]))
       UNION
       SELECT u.id, u.display_name, r.code AS role_code
       FROM gym_members gm
       JOIN users u ON u.id = gm.linked_user_id
       JOIN roles r ON r.id = u.role_id
       WHERE gm.is_self = FALSE
         AND gm.linked_user_id IS NOT NULL
         AND gm.profile_access = 'approved'
         AND u.is_active = TRUE
         AND u.id <> $2
         AND ($3::text[] IS NULL OR r.code = ANY($3::text[]))
         AND ($4::boolean = FALSE OR gm.owner_user_id = $2)
         AND ($5::boolean = FALSE OR (cardinality($1::uuid[]) > 0 AND gm.gym_id = ANY($1::uuid[])))
     )
     SELECT DISTINCT ON (id) id, display_name, role_code
     FROM scoped
     ORDER BY id
     LIMIT $6`,
    [gymIds, senderId, roleCodes, requireOwnerLink, scopeLinkedToGyms, limit]
  );

  return result.rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    roleCode: isRoleCode(r.role_code) ? r.role_code : Role.MEMBER,
  }));
}

async function listTrainerClientIds(trainerUserId: string): Promise<string[]> {
  const pool = getPool();
  if (!pool) return [];

  const result = await pool.query<{ linked_user_id: string }>(
    `SELECT DISTINCT gm.linked_user_id
     FROM gym_members gm
     WHERE gm.owner_user_id = $1
       AND gm.is_self = FALSE
       AND gm.linked_user_id IS NOT NULL
       AND gm.profile_access = 'approved'`,
    [trainerUserId]
  );
  return result.rows.map((r) => r.linked_user_id);
}

async function areUsersConnected(
  senderId: string,
  recipientId: string
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  const result = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM gym_members
       WHERE profile_access = 'approved'
         AND is_self = FALSE
         AND (
           (owner_user_id = $1 AND linked_user_id = $2)
           OR (owner_user_id = $2 AND linked_user_id = $1)
         )
     ) AS ok`,
    [senderId, recipientId]
  );
  return Boolean(result.rows[0]?.ok);
}

async function resolveMemberExact(
  senderId: string,
  query: string | undefined
): Promise<ResolvedAudienceUser[]> {
  if (!query?.trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'query is required for member_exact');
  }
  const q = query.trim();
  const pool = getPool();

  let candidate: ResolvedAudienceUser | null = null;

  if (UUID_RE.test(q)) {
    const users = await findUsersByIds([q]);
    candidate = users[0] ?? null;
  } else if (!pool) {
    const matches = listDevUsers().filter(
      (u) => u.isActive && u.displayName.toLowerCase() === q.toLowerCase()
    );
    if (matches.length > 1) {
      throw new AppError(400, 'AMBIGUOUS_USER', 'Multiple users match display name');
    }
    const m = matches[0];
    if (m) {
      candidate = {
        id: m.id,
        displayName: m.displayName,
        roleCode: isRoleCode(m.roleCode) ? m.roleCode : Role.MEMBER,
      };
    }
  } else {
    const result = await pool.query<{
      id: string;
      display_name: string;
      role_code: string;
    }>(
      `SELECT u.id, u.display_name, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.is_active = TRUE AND LOWER(u.display_name) = LOWER($1)`,
      [q]
    );
    if (result.rows.length > 1) {
      throw new AppError(400, 'AMBIGUOUS_USER', 'Multiple users match display name');
    }
    const row = result.rows[0];
    if (row) {
      candidate = {
        id: row.id,
        displayName: row.display_name,
        roleCode: isRoleCode(row.role_code) ? row.role_code : Role.MEMBER,
      };
    }
  }

  if (!candidate) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  if (candidate.id === senderId) {
    throw new AppError(400, 'INVALID_RECIPIENT', 'Cannot send to yourself');
  }
  if (!isMemberTierRole(candidate.roleCode)) {
    throw new AppError(403, 'FORBIDDEN', 'Recipient must be a member-tier role');
  }
  const connected = await areUsersConnected(senderId, candidate.id);
  if (!connected) {
    throw new AppError(403, 'FORBIDDEN', 'Recipient is not a connected friend');
  }
  return [candidate];
}

async function resolveLocationAudience(
  audience: PushAudienceInput,
  limit: number
): Promise<ResolvedAudienceUser[]> {
  const pool = getPool();
  if (!pool) return [];

  const conditions: string[] = ['u.is_active = TRUE'];
  const params: unknown[] = [];
  let i = 1;

  if (audience.countryCode) {
    conditions.push(`ul.country_code = $${i++}`);
    params.push(audience.countryCode);
  }
  if (audience.stateId) {
    conditions.push(`ul.state_id = $${i++}`);
    params.push(audience.stateId);
  }
  if (audience.cityId) {
    conditions.push(`ul.city_id = $${i++}`);
    params.push(audience.cityId);
  }
  if (audience.districtId) {
    conditions.push(`ul.district_id = $${i++}`);
    params.push(audience.districtId);
  }

  if (params.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'location audience requires at least one location filter');
  }

  params.push(limit);
  const result = await pool.query<{
    id: string;
    display_name: string;
    role_code: string;
  }>(
    `SELECT u.id, u.display_name, r.code AS role_code
     FROM user_locations ul
     JOIN users u ON u.id = ul.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.created_at DESC
     LIMIT $${i}`,
    params
  );

  return result.rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    roleCode: isRoleCode(r.role_code) ? r.role_code : Role.MEMBER,
  }));
}

/**
 * Re-check each recipient is allowed for the sender/audience (defense in depth).
 * Returns filtered list; callers should treat removals as skipped.
 */
export async function authorizeResolvedRecipients(
  senderId: string,
  senderRole: RoleCode,
  audience: PushAudienceInput,
  recipients: ResolvedAudienceUser[]
): Promise<{ allowed: ResolvedAudienceUser[]; skipped: number }> {
  const meta = getPushComposeMeta(senderRole);
  const allowed: ResolvedAudienceUser[] = [];
  let skipped = 0;

  let allowedIdSet: Set<string> | null = null;

  if (hasMinRole(senderRole, Role.ADMIN)) {
    allowedIdSet = null;
  } else if (hasMinRole(senderRole, Role.OWNER)) {
    const gymIds = await listOwnedGymIds(senderId);
    if (audience.type === 'gym' && audience.gymId) {
      if (!ownerMayTargetGym(gymIds, audience.gymId)) {
        throw new AppError(403, 'FORBIDDEN', 'You do not own this gym');
      }
    }
    const scoped = await resolveOwnerGymScopedUsers(
      senderId,
      audience.type === 'gym' && audience.gymId ? [audience.gymId] : gymIds,
      null,
      meta.maxRecipients,
      { requireOwnerLink: true, scopeLinkedToGyms: false }
    );
    allowedIdSet = new Set(scoped.map((u) => u.id));
  } else if (hasMinRole(senderRole, Role.TRAINER)) {
    const clientIds = await listTrainerClientIds(senderId);
    allowedIdSet = new Set(clientIds);
  } else if (isMemberTierRole(senderRole)) {
    // member_exact already validated connection; keep as-is
    allowedIdSet = new Set(recipients.map((r) => r.id));
  } else {
    return { allowed: [], skipped: recipients.length };
  }

  for (const r of recipients) {
    if (r.id === senderId) {
      skipped += 1;
      continue;
    }
    if (allowedIdSet && !allowedIdSet.has(r.id)) {
      skipped += 1;
      continue;
    }
    // Trainer (non-owner) may only message member-tier clients
    if (
      hasMinRole(senderRole, Role.TRAINER) &&
      !hasMinRole(senderRole, Role.OWNER) &&
      !hasMinRole(senderRole, Role.ADMIN)
    ) {
      if (!isMemberTierRole(r.roleCode)) {
        skipped += 1;
        continue;
      }
    }
    // Member-tier senders may only message member-tier
    if (
      isMemberTierRole(senderRole) &&
      !hasMinRole(senderRole, Role.TRAINER) &&
      !isMemberTierRole(r.roleCode)
    ) {
      skipped += 1;
      continue;
    }
    if (allowed.length >= meta.maxRecipients) {
      skipped += 1;
      continue;
    }
    allowed.push(r);
  }

  return { allowed, skipped };
}

export const pushAudienceService = {
  getComposeMeta: getPushComposeMeta,
  authorizeAudienceType,

  async getCapabilities(
    senderId: string,
    knownRole?: RoleCode
  ): Promise<PushComposeCapabilities> {
    let sender: { id: string; displayName: string; roleCode: RoleCode };
    try {
      sender = await loadSenderUser(senderId);
    } catch {
      if (!knownRole || !isRoleCode(knownRole)) throw new AppError(404, 'NOT_FOUND', 'Sender not found');
      sender = { id: senderId, displayName: '', roleCode: knownRole };
    }
    const meta = getPushComposeMeta(sender.roleCode);

    const gyms =
      hasMinRole(sender.roleCode, Role.OWNER) || hasMinRole(sender.roleCode, Role.ADMIN)
        ? hasMinRole(sender.roleCode, Role.ADMIN)
          ? await listAllOfficialGyms()
          : await listOwnedGyms(senderId)
        : [];

    let suggestedRecipients: PushComposeCapabilities['suggestedRecipients'] = [];

    if (hasMinRole(sender.roleCode, Role.OWNER) && !hasMinRole(sender.roleCode, Role.ADMIN)) {
      const gymIds = gyms.map((g) => g.id);
      const users = await resolveOwnerGymScopedUsers(
        senderId,
        gymIds,
        null,
        50,
        { requireOwnerLink: true, scopeLinkedToGyms: false }
      );
      suggestedRecipients = users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        roleCode: u.roleCode,
        label: isMemberTierRole(u.roleCode) ? 'member' : u.roleCode,
      }));
    } else if (
      hasMinRole(sender.roleCode, Role.TRAINER) &&
      !hasMinRole(sender.roleCode, Role.OWNER)
    ) {
      const clientIds = await listTrainerClientIds(senderId);
      const users = await findUsersByIds(clientIds);
      suggestedRecipients = users
        .filter((u) => isMemberTierRole(u.roleCode))
        .slice(0, 50)
        .map((u) => ({
          id: u.id,
          displayName: u.displayName,
          roleCode: u.roleCode,
          label: 'client',
        }));
    }

    return {
      canCompose: meta.canCompose,
      senderRole: sender.roleCode,
      allowedAudienceTypes: meta.allowedAudienceTypes,
      maxRecipients: meta.maxRecipients,
      gyms,
      suggestedRecipients,
    };
  },

  async resolveRecipients(
    senderId: string,
    senderRole: RoleCode,
    audience: PushAudienceInput
  ): Promise<{
    recipients: ResolvedAudienceUser[];
    skipped: number;
  }> {
    if (!authorizeAudienceType(senderRole, audience.type)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        `Audience type '${audience.type}' is not allowed for role '${senderRole}'`
      );
    }

    const meta = getPushComposeMeta(senderRole);
    if (!meta.canCompose || meta.maxRecipients <= 0) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot compose push notifications');
    }

    let raw: ResolvedAudienceUser[] = [];

    switch (audience.type) {
      case 'all_users': {
        raw = await listActiveUsersByRole(undefined, meta.maxRecipients + 1);
        break;
      }
      case 'role': {
        if (!audience.roleCode || !isRoleCode(audience.roleCode)) {
          throw new AppError(400, 'VALIDATION_ERROR', 'roleCode is required for role audience');
        }
        raw = await listActiveUsersByRole(audience.roleCode, meta.maxRecipients + 1);
        break;
      }
      case 'location': {
        raw = await resolveLocationAudience(audience, meta.maxRecipients + 1);
        break;
      }
      case 'gym': {
        if (!audience.gymId) {
          throw new AppError(400, 'VALIDATION_ERROR', 'gymId is required for gym audience');
        }
        if (!hasMinRole(senderRole, Role.ADMIN)) {
          await assertOwnsGym(senderId, audience.gymId);
        }
        raw = await resolveOwnerGymScopedUsers(
          senderId,
          [audience.gymId],
          audience.roleCode ?? null,
          meta.maxRecipients + 1,
          {
            requireOwnerLink: !hasMinRole(senderRole, Role.ADMIN),
            // Owner links are by owner_user_id; personal gym_members.gym_id ≠ official gym id
            scopeLinkedToGyms: hasMinRole(senderRole, Role.ADMIN),
          }
        );
        break;
      }
      case 'owner_gym_trainers': {
        let gymIds: string[];
        if (audience.gymId) {
          if (!hasMinRole(senderRole, Role.ADMIN)) {
            await assertOwnsGym(senderId, audience.gymId);
          }
          gymIds = [audience.gymId];
        } else if (hasMinRole(senderRole, Role.ADMIN)) {
          const owned = await listOwnedGymIds(senderId);
          gymIds = owned.length > 0 ? owned : await listAllOfficialGymIds();
        } else {
          gymIds = await listOwnedGymIds(senderId);
        }
        raw = await resolveOwnerGymScopedUsers(
          senderId,
          gymIds,
          'trainer',
          meta.maxRecipients + 1,
          {
            requireOwnerLink: !hasMinRole(senderRole, Role.ADMIN),
            scopeLinkedToGyms: hasMinRole(senderRole, Role.ADMIN),
          }
        );
        break;
      }
      case 'owner_gym_members': {
        let gymIds: string[];
        if (audience.gymId) {
          if (!hasMinRole(senderRole, Role.ADMIN)) {
            await assertOwnsGym(senderId, audience.gymId);
          }
          gymIds = [audience.gymId];
        } else if (hasMinRole(senderRole, Role.ADMIN)) {
          const owned = await listOwnedGymIds(senderId);
          gymIds = owned.length > 0 ? owned : await listAllOfficialGymIds();
        } else {
          gymIds = await listOwnedGymIds(senderId);
        }
        raw = await resolveOwnerGymScopedUsers(
          senderId,
          gymIds,
          'member_tier',
          meta.maxRecipients + 1,
          {
            requireOwnerLink: !hasMinRole(senderRole, Role.ADMIN),
            scopeLinkedToGyms: hasMinRole(senderRole, Role.ADMIN),
          }
        );
        break;
      }
      case 'trainer_clients': {
        const clientIds = await listTrainerClientIds(senderId);
        const users = await findUsersByIds(clientIds);
        raw = users.filter((u) => isMemberTierRole(u.roleCode));
        break;
      }
      case 'user_ids': {
        const ids = audience.userIds ?? [];
        if (ids.length === 0) {
          throw new AppError(400, 'VALIDATION_ERROR', 'userIds is required');
        }
        raw = await findUsersByIds(ids);

        if (
          hasMinRole(senderRole, Role.TRAINER) &&
          !hasMinRole(senderRole, Role.OWNER) &&
          !hasMinRole(senderRole, Role.ADMIN)
        ) {
          const clientIds = new Set(await listTrainerClientIds(senderId));
          const rejected = raw.filter(
            (u) => !clientIds.has(u.id) || !isMemberTierRole(u.roleCode)
          );
          if (rejected.length > 0) {
            throw new AppError(
              403,
              'FORBIDDEN',
              'Trainers may only message approved member-tier clients'
            );
          }
          raw = raw.filter((u) => clientIds.has(u.id) && isMemberTierRole(u.roleCode));
        } else if (
          hasMinRole(senderRole, Role.OWNER) &&
          !hasMinRole(senderRole, Role.ADMIN)
        ) {
          const gymIds = await listOwnedGymIds(senderId);
          const scoped = await resolveOwnerGymScopedUsers(
            senderId,
            gymIds,
            null,
            meta.maxRecipients + ids.length,
            { requireOwnerLink: true, scopeLinkedToGyms: false }
          );
          const scopedIds = new Set(scoped.map((u) => u.id));
          const rejected = raw.filter((u) => !scopedIds.has(u.id));
          if (rejected.length > 0) {
            throw new AppError(
              403,
              'FORBIDDEN',
              'Owners may only message users within owned gyms'
            );
          }
          raw = raw.filter((u) => scopedIds.has(u.id));
        }
        break;
      }
      case 'member_exact': {
        raw = await resolveMemberExact(senderId, audience.query);
        break;
      }
      default: {
        throw new AppError(400, 'VALIDATION_ERROR', `Unknown audience type`);
      }
    }

    const { allowed, skipped } = await authorizeResolvedRecipients(
      senderId,
      senderRole,
      audience,
      raw
    );

    return { recipients: allowed, skipped };
  },
};

async function listAllOfficialGyms(): Promise<Array<{ id: string; name: string }>> {
  const pool = getPool();
  if (!pool) return [];
  const result = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM gyms WHERE is_active = TRUE ORDER BY name ASC LIMIT 500`
  );
  return result.rows;
}

async function listAllOfficialGymIds(): Promise<string[]> {
  const gyms = await listAllOfficialGyms();
  return gyms.map((g) => g.id);
}
