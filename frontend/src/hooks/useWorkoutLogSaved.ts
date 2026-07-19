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

export function useWorkoutLogSaved({
  machineCode,
  logDate,
  targetMuscleGroup,
  isAuthenticated,
}: UseWorkoutLogSavedOptions) {
  const normalizedLogDate = normalizeDateKey(logDate);
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const queryTargetMuscle = getWorkoutLogQueryTargetMuscle(machineCode, targetMuscleGroup);
  const queryEnabled =
    isAuthenticated &&
    Boolean(machineCode && normalizedLogDate) &&
    (!isFreeWeight || !!queryTargetMuscle);

  const { data: logs } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, normalizedLogDate, queryTargetMuscle),
    queryFn: async () => {
      const res = await workoutLogApi.list({
        machineCode,
        logDate: normalizedLogDate,
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
  });

  return Boolean(logs?.[0]);
}
