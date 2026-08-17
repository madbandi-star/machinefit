import type { User } from '@machinefit/shared';
import { queryClient } from '@/app/providers/QueryProvider';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useGymStore } from '@/store/gym.store';

/** Reset persisted gym/member picks and drop cached API data on logout. */
export function clearGymScope(): void {
  useGymStore.getState().setActiveGymId(null);
  useGymStore.getState().setActiveMemberId(null);
  queryClient.clear();
}

/**
 * User / gym-scoped query prefixes that must not leak across accounts.
 * Catalog (brands/machines) and other static caches stay warm after login.
 */
const AUTH_SCOPED_QUERY_PREFIXES: readonly (readonly unknown[])[] = [
  QUERY_KEYS.me,
  QUERY_KEYS.history,
  QUERY_KEYS.workoutLogs,
  QUERY_KEYS.workoutCards,
  ['favorites'],
  QUERY_KEYS.brandFavorites,
  QUERY_KEYS.machineRequestsRoot,
  ['user'],
  ['gyms'],
  ['easy-history'],
  ['machine-preferences'],
  ['billing'],
  ['premium'],
  ['notifications'],
  ['workout-logs'],
  ['points'],
  ['fortune'],
];

function removeAuthScopedQueries(): void {
  for (const prefix of AUTH_SCOPED_QUERY_PREFIXES) {
    queryClient.removeQueries({ queryKey: [...prefix] });
  }
}

/**
 * After login/register, seed gym scope from the authenticated user and
 * drop only user/gym-scoped caches — keep catalog/brand caches.
 */
export function syncGymScopeAfterAuth(user: User): void {
  useGymStore.getState().setActiveMemberId(null);
  useGymStore.getState().setActiveGymId(user.activeGymId ?? null);
  removeAuthScopedQueries();
}
