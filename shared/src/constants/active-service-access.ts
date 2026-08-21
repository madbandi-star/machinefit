/**
 * Soft-launch allowlist: only these MachineFit usernames (displayName) may use the app
 * when access enforcement is explicitly enabled.
 * Matching uses usernameUniqueKey (NFC + Latin lower-case).
 */
import { normalizeUsername, usernameUniqueKey } from '../utils/username.js';

/** Soft-open accounts (아이디 = users.display_name). Kept for optional re-enable. */
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
 * Soft-launch allowlist is off by default (all logged-in users can use the app).
 * Enable only when explicitly set:
 * Backend: ACTIVE_SERVICE_ACCESS=1
 * Frontend: VITE_ACTIVE_SERVICE_ACCESS=1
 */
export function isActiveServiceAccessEnforced(envValue?: string | null): boolean {
  const raw = (envValue ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}
