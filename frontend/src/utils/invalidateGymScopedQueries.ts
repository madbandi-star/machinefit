import type { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';

/** Invalidate history / favorites / workout logs when gym or member scope changes. */
export function invalidateGymScopedQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  void queryClient.invalidateQueries({ queryKey: ['favorites'] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userGyms });
}
