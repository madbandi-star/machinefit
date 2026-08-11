import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isAllGymsId } from '@machinefit/shared';
import { workoutCardApi } from '@/api/workout-card.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { getTodayDateKey } from '@/utils/historyDate';

/** Count of today's PLANNED / IN_PROGRESS workout cards for the active gym+member. */
export function useTodayActivePlanCount(): {
  count: number;
  /**
   * Stable signature of today's active plans (date + gym/member + card ids).
   * Used to dismiss the Records nav green dot until the plan set changes.
   */
  planSignature: string | null;
  gymReady: boolean;
  isLoading: boolean;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const today = getTodayDateKey();
  const memberKey = activeMemberId ?? '';
  const gymReady =
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    memberScopeReady &&
    !isAllGymsId(activeGymId ?? '');

  const { data: todayCards = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.workoutCardsList(activeGymId ?? '', memberKey, {
      scheduledDate: today,
    }),
    queryFn: async () => {
      const res = await workoutCardApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        scheduledDate: today,
      });
      return res.data.data ?? [];
    },
    enabled: gymReady,
    staleTime: 30_000,
  });

  const activePlanIds = useMemo(
    () =>
      todayCards
        .filter((card) => card.status === 'PLANNED' || card.status === 'IN_PROGRESS')
        .map((card) => card.id)
        .sort(),
    [todayCards]
  );

  const count = activePlanIds.length;
  const planSignature =
    gymReady && count > 0
      ? `${today}|${activeGymId}|${memberKey}|${activePlanIds.join(',')}`
      : null;

  return { count, planSignature, gymReady, isLoading };
}
