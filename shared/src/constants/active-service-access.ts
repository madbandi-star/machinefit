/**
 * Soft-launch allowlist: only these MachineFit usernames (displayName) may use the app.
 * Matching uses usernameUniqueKey (NFC + Latin lower-case).
 */
import { normalizeUsername, usernameUniqueKey } from '../utils/username.js';

/** Soft-open accounts (아이디 = users.display_name). */
export const ACTIVE_SERVICE_USERNAMES = [
  '핏러너1205',
  '제이진파크',
  '사레레',
  '짐메이트0587',
] as const;

const ALLOW_KEYS = new Set(
  ACTIVE_SERVICE_USERNAMES.map((name) => usernameUniqueKey(normalizeUsername(name)))
);

export function isActiveServiceUsername(displayName: string | null | undefined): boolean {
  if (!displayName?.trim()) return false;
  return ALLOW_KEYS.has(usernameUniqueKey(normalizeUsername(displayName)));
}

/**
 * Enforce allowlist unless explicitly disabled.
 * Backend: ACTIVE_SERVICE_ACCESS=0
 * Frontend: VITE_ACTIVE_SERVICE_ACCESS=0
 */
export function isActiveServiceAccessEnforced(envValue?: string | null): boolean {
  const raw = (envValue ?? '').trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off') return false;
  return true;
}
