import { Role } from './roles.js';
import type { RoleCode } from '../types/api.types.js';

/**
 * Free-open (ads) period: photo board + user backup are login-only (MEMBER+).
 *
 * Paid conversion:
 * 1. Set this to `Role.PREMIUM_MEMBER` for UI/route guards, AND
 * 2. Replace `requireMinRole(...)` on photo-board/backup APIs with `requirePremium()`
 *    so Polar entitlement (not role) is the source of truth.
 */
export const FREE_OPEN_MEMBER_FEATURES_MIN_ROLE: RoleCode = Role.MEMBER;
