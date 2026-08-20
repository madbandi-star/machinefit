import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAllGymsId } from '@machinefit/shared';
import { userApi, type HomeBootstrapResponse } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { getTodayDateKey } from '@/utils/historyDate';

/** Includes that cut follow-up Home round-trips (optional fields on same schema). */
const HOME_BOOTSTRAP_INCLUDE = 'todayCards,missed';

function seedHomeBootstrapCache(
  queryClient: ReturnType<typeof useQueryClient>,
  data: HomeBootstrapResponse
) {
  queryClient.setQueryData(QUERY_KEYS.userGyms, data.gyms);

  if (!isAllGymsId(data.activeGymId)) {
    queryClient.setQueryData(QUERY_KEYS.userGymMembers(data.activeGymId), data.members);
  }

  const memberKey = data.activeMemberId ?? '';
  queryClient.setQueryData(
    QUERY_KEYS.historyList(data.activeGymId, memberKey, { limit: 40 }),
    data.recentHistory
  );
  queryClient.setQueryData(QUERY_KEYS.favorites(data.activeGymId, memberKey), data.favorites);

  const today = getTodayDateKey();
  if (data.todayWorkoutCards && !isAllGymsId(data.activeGymId)) {
    queryClient.setQueryData(
      QUERY_KEYS.workoutCardsList(data.activeGymId, memberKey, { scheduledDate: today }),
      data.todayWorkoutCards
    );
  }
  if (data.missedWorkoutCards && !isAllGymsId(data.activeGymId)) {
    queryClient.setQueryData(
      QUERY_KEYS.workoutCardsMissed(data.activeGymId, memberKey),
      data.missedWorkoutCards
    );
  }
}

/**
 * One round-trip for home: gyms, members, recent history, favorites (+ optional cards).
 * Seeds React Query caches used by useActiveGym / home rows (in queryFn to avoid races).
 */
export function useHomeBootstrap() {
  const authReady = useAuthHydration();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storedGymId = useGymStore((s) => s.activeGymId);
  const storedMemberId = useGymStore((s) => s.activeMemberId);
  const setActiveGymId = useGymStore((s) => s.setActiveGymId);
  const setActiveMemberId = useGymStore((s) => s.setActiveMemberId);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.homeBootstrap(storedGymId, storedMemberId),
    queryFn: async () => {
      const res = await userApi.homeBootstrap({
        gymId: storedGymId ?? undefined,
        memberId: storedMemberId ?? undefined,
        include: HOME_BOOTSTRAP_INCLUDE,
      });
      const data = res.data.data;
      // Seed before observers re-render so useActiveGym skips a parallel gyms GET.
      seedHomeBootstrapCache(queryClient, data);
      return data;
    },
    enabled: authReady && isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!query.data) return;
    // Do not re-seed favorites/history here — queryFn already seeds on fetch.
    // Re-seeding from stale bootstrap overwrites fresher data after deletes.
    if (query.data.activeGymId) {
      setActiveGymId(query.data.activeGymId);
    }
    if (query.data.activeMemberId) {
      setActiveMemberId(query.data.activeMemberId);
    }
  }, [query.data, setActiveGymId, setActiveMemberId]);

  return {
    isBootstrapping: query.isLoading || query.isFetching,
    isReady: !isAuthenticated || query.isSuccess || query.isError,
  };
}

/** Runs once after auth without blocking UI. */
export function HomeBootstrapLoader() {
  useHomeBootstrap();
  return null;
}
