import type { User } from '@machinefit/shared';
import { queryClient } from '@/app/providers/QueryProvider';
import { useGymStore } from '@/store/gym.store';

/** Reset persisted gym/member picks and drop cached API data on logout. */
export function clearGymScope(): void {
  useGymStore.getState().setActiveGymId(null);
  useGymStore.getState().setActiveMemberId(null);
  queryClient.clear();
}

/**
 * After login/register, seed gym scope from the authenticated user and
 * clear stale queries from a previous session or account.
 */
export function syncGymScopeAfterAuth(user: User): void {
  useGymStore.getState().setActiveMemberId(null);
  useGymStore.getState().setActiveGymId(user.activeGymId ?? null);
  queryClient.clear();
}
