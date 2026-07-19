import { useQuery } from '@tanstack/react-query';
import { isFreeWeightMachineCode, type TargetMuscleGroup } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';

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
  const queryEnabled = isAuthenticated && Boolean(machineCode && logDate) && (!isFreeWeight || !!targetMuscleGroup);

  const { data: logs } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, logDate, targetMuscleGroup),
    queryFn: async () => {
      const res = await workoutLogApi.list({
        machineCode,
        logDate,
        ...(isFreeWeight && targetMuscleGroup ? { targetMuscleGroup } : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
  });

  return Boolean(logs?.[0]);
}
