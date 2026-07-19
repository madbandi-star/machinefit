import { useQuery } from '@tanstack/react-query';
import type { TargetMuscleGroup } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
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
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const queryTargetMuscle = getWorkoutLogQueryTargetMuscle(machineCode, targetMuscleGroup);
  const queryEnabled =
    isAuthenticated && Boolean(machineCode && logDate) && (!isFreeWeight || !!queryTargetMuscle);

  const { data: logs } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, logDate, queryTargetMuscle),
    queryFn: async () => {
      const res = await workoutLogApi.list({
        machineCode,
        logDate,
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
  });

  return Boolean(logs?.[0]);
}
