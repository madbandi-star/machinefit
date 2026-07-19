import { useQuery } from '@tanstack/react-query';
import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { normalizeDateKey } from '@/utils/historyDate';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';

interface UseWorkoutLogSavedOptions {
  machineCode: string;
  logDate: string;
  targetMuscleGroup?: TargetMuscleGroup;
  isAuthenticated: boolean;
}

export function buildWorkoutLogSavedQueryKey(
  machineCode: string,
  logDate: string,
  targetMuscleGroup?: TargetMuscleGroup
) {
  const normalizedLogDate = normalizeDateKey(logDate);
  const queryTargetMuscle = getWorkoutLogQueryTargetMuscle(machineCode, targetMuscleGroup);
  return {
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, normalizedLogDate, queryTargetMuscle),
    normalizedLogDate,
    queryTargetMuscle,
  };
}

export function useWorkoutLogSaved({
  machineCode,
  logDate,
  targetMuscleGroup,
  isAuthenticated,
}: UseWorkoutLogSavedOptions) {
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const { queryKey, normalizedLogDate, queryTargetMuscle } = buildWorkoutLogSavedQueryKey(
    machineCode,
    logDate,
    targetMuscleGroup
  );
  const queryEnabled =
    isAuthenticated &&
    Boolean(machineCode && normalizedLogDate) &&
    (!isFreeWeight || !!queryTargetMuscle);

  const { data: logs } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await workoutLogApi.list({
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

  return Boolean(logs?.[0]);
}
