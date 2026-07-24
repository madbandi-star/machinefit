import type { RoleCode } from '../types/api.types.js';

/**
 * Canonical role enum — single source of truth for account RBAC.
 * Prefer `Role.*` / `RoleCode` over raw string literals at call sites.
 */
export const Role = {
  GUEST: 'guest',
  MEMBER: 'member',
  PREMIUM_MEMBER: 'premium_member',
  VIP_MEMBER: 'vip_member',
  TRAINER: 'trainer',
  OWNER: 'owner',
  ADMIN: 'admin',
} as const satisfies Record<string, RoleCode>;

/** Ordered from lowest → highest privilege (stable for inserts / UI). */
export const ROLE_CODES = [
  Role.GUEST,
  Role.MEMBER,
  Role.PREMIUM_MEMBER,
  Role.VIP_MEMBER,
  Role.TRAINER,
  Role.OWNER,
  Role.ADMIN,
] as const satisfies readonly RoleCode[];

/**
 * Numeric privilege levels. Access checks MUST use level comparison:
 * `getRoleLevel(current) >= getRoleLevel(required)`.
 */
export const ROLE_LEVEL = {
  [Role.GUEST]: 0,
  [Role.MEMBER]: 1,
  [Role.PREMIUM_MEMBER]: 2,
  [Role.VIP_MEMBER]: 3,
  [Role.TRAINER]: 4,
  [Role.OWNER]: 5,
  [Role.ADMIN]: 6,
} as const satisfies Record<RoleCode, number>;

/** @deprecated Use ROLE_LEVEL — kept for gradual migration of imports. */
export const ROLE_HIERARCHY = ROLE_LEVEL;

/** Alias map (RoleCode → RoleCode) for ergonomic `ROLES.admin` access. */
export const ROLES = {
  guest: Role.GUEST,
  member: Role.MEMBER,
  premium_member: Role.PREMIUM_MEMBER,
  vip_member: Role.VIP_MEMBER,
  trainer: Role.TRAINER,
  owner: Role.OWNER,
  admin: Role.ADMIN,
} as const satisfies Record<RoleCode, RoleCode>;

/** Roles an admin may assign in the admin UI / API (includes guest). */
export const ASSIGNABLE_ROLE_CODES = ROLE_CODES;

/** Roles typically stored on registered accounts (excludes guest). */
export const REGISTERED_ROLE_CODES = ROLE_CODES.filter(
  (code) => code !== Role.GUEST
) as Exclude<RoleCode, 'guest'>[];

const ROLE_CODE_SET = new Set<string>(ROLE_CODES);

export function isRoleCode(value: unknown): value is RoleCode {
  return typeof value === 'string' && ROLE_CODE_SET.has(value);
}

/** Unknown / missing roles resolve to guest (least privilege). */
export function getRoleLevel(role: string | null | undefined): number {
  if (isRoleCode(role)) return ROLE_LEVEL[role];
  return ROLE_LEVEL[Role.GUEST];
}

/**
 * Hierarchical check: current role inherits all lower roles.
 * `hasMinRole('admin', 'owner')` → true
 */
export function hasMinRole(
  currentRole: string | null | undefined,
  requiredRole: RoleCode
): boolean {
  return getRoleLevel(currentRole) >= ROLE_LEVEL[requiredRole];
}

/** Exact role match (rare — prefer hasMinRole for access control). */
export function hasExactRole(
  currentRole: string | null | undefined,
  role: RoleCode
): boolean {
  return isRoleCode(currentRole) && currentRole === role;
}

/** Lowest role among a list (for interpreting legacy allowlists). */
export function lowestRole(roles: readonly RoleCode[]): RoleCode {
  if (roles.length === 0) return Role.GUEST;
  return roles.reduce((min, role) =>
    ROLE_LEVEL[role] < ROLE_LEVEL[min] ? role : min
  );
}

/**
 * Commercial premium entitlement via role.
 * Preserves legacy behavior: only admin was auto-premium among staff roles.
 * New paid ladder roles (premium_member, vip_member) also unlock premium limits.
 * trainer/owner still use subscription_plan unless elevated to paid roles or admin.
 */
export function roleGrantsPremiumPlan(role: string | null | undefined): boolean {
  if (!isRoleCode(role)) return false;
  if (hasMinRole(role, Role.ADMIN)) return true;
  return role === Role.PREMIUM_MEMBER || role === Role.VIP_MEMBER;
}
