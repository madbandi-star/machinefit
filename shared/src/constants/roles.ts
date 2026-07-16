import type { RoleCode } from '../types/api.types.js';

export const ROLES: Record<RoleCode, RoleCode> = {
  guest: 'guest',
  member: 'member',
  owner: 'owner',
  admin: 'admin',
} as const;

export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  guest: 0,
  member: 1,
  owner: 2,
  admin: 3,
};
