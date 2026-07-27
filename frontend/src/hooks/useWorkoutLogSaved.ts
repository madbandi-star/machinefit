import { useQuery } from '@tanstack/react-query';
import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { normalizeDateKey } from '@/utils/historyDate';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';

interface UseWorkoutLogSavedOptions {
  machineCode: string;
  logDate: string;
  targetMuscleGroup?: TargetMuscleGroup;
  isAuthenticated: boolean;
  /**
   * When boolean, skip per-card list GET — parent already knows saved state
   * from the shared workout-logs list (identical UI).
   */
  initialSaved?: boolean | null;
}

export function buildWorkoutLogSavedQueryKey(
  gymId: string,
  memberId: string,
  machineCode: string,
  logDate: string,
  targetMuscleGroup?: TargetMuscleGroup
) {
  const normalizedLogDate = normalizeDateKey(logDate);
  const queryTargetMuscle = getWorkoutLogQueryTargetMuscle(machineCode, targetMuscleGroup);
  return {
    queryKey: QUERY_KEYS.workoutLogToday(
      gymId,
      memberId,
      machineCode,
      normalizedLogDate,
      queryTargetMuscle
    ),
    normalizedLogDate,
    queryTargetMuscle,
  };
}

export function useWorkoutLogSaved({
  machineCode,
  logDate,
  targetMuscleGroup,
  isAuthenticated,
  initialSaved = null,
}: UseWorkoutLogSavedOptions) {
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const { queryKey, normalizedLogDate, queryTargetMuscle } = buildWorkoutLogSavedQueryKey(
    activeGymId ?? '',
    memberKey,
    machineCode,
    logDate,
    targetMuscleGroup
  );
  const hasListSeed = initialSaved !== null && initialSaved !== undefined;
  const queryEnabled =
    isAuthenticated &&
    Boolean(activeGymId) &&
    memberScopeReady &&
    Boolean(machineCode && normalizedLogDate) &&
    (!isFreeWeight || !!queryTargetMuscle) &&
    !hasListSeed;

  const { data: logs } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await workoutLogApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId ?? undefined,
        machineCode,
        logDate: normalizedLogDate,
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (hasListSeed) return Boolean(initialSaved);
  return Boolean(logs?.[0]);
}
