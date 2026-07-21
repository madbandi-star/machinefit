import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ExperienceLevel,
  Gender,
  RecommendationInput,
  TargetMuscleGroup,
} from '@machinefit/shared';
import { isFreeWeightMachineCode, isAllGymsId } from '@machinefit/shared';
import { historyApi, recommendationApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import {
  buildRecordsHistoryFocusUrl,
  DuplicateRecommendationError,
} from '@/utils/recommendationDuplicate';
import { getLocalDayRange, getTodayDateKey } from '@/utils/historyDate';

function buildProfileInput(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup
): RecommendationInput | null {
  const user = useAuthStore.getState().user;
  const { unitHeight, unitWeight, weightDifficulty } = useSettingsStore.getState();

  const heightCm = user?.heightCm;
  const weightKg = user?.weightKg;
  if (heightCm == null || heightCm < 100 || heightCm > 250) {
    return null;
  }
  if (weightKg == null || weightKg < 30 || weightKg > 300) {
    return null;
  }
  if (!user?.gender) {
    return null;
  }

  const gender: Gender = user.gender;
  const experienceLevel: ExperienceLevel = user.experienceLevel ?? 'intermediate';

  return {
    machineCode,
    gender,
    heightCm,
    weightKg,
    experienceLevel,
    unitHeight,
    unitWeight,
    weightDifficulty,
    ...(user.age != null ? { age: user.age } : {}),
    ...(user.workoutGoal ? { workoutGoal: user.workoutGoal } : {}),
    ...(targetMuscleGroup ? { targetMuscleGroup } : {}),
  };
}

export interface RecommendMachineOptions {
  targetMuscleGroup?: TargetMuscleGroup;
}

export function useRecommendMachine(machineCode: string | undefined) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation(['common', 'machines']);
  const showToast = useUIStore((s) => s.showToast);

  const mutation = useMutation({
    mutationFn: async (options: RecommendMachineOptions = {}) => {
      if (!machineCode) throw new Error('missing_machine');
      const input = buildProfileInput(machineCode, options?.targetMuscleGroup);
      if (!input) {
        const user = useAuthStore.getState().user;
        if (!user?.gender) throw new Error('missing_gender');
        throw new Error('missing_profile');
      }

      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (isAuthenticated) {
        const gymId = useGymStore.getState().activeGymId;
        if (!gymId) throw new Error('missing_gym');
        const memberId = useGymStore.getState().activeMemberId ?? undefined;
        const today = getTodayDateKey();
        const { from, to } = getLocalDayRange(today);
        const historyRes = await historyApi.list(gymId, {
          machineCode,
          limit: 20,
          from,
          to,
          ...(memberId ? { memberId } : {}),
        });
        const todayItems = historyRes.data.data;
        const requestedMuscle = options?.targetMuscleGroup;

        if (isFreeWeightMachineCode(machineCode)) {
          if (requestedMuscle) {
            const sameMuscleToday = todayItems.find(
              (item) => item.targetMuscleGroup === requestedMuscle
            );
            if (sameMuscleToday) {
              throw new DuplicateRecommendationError(sameMuscleToday);
            }
          }
        } else if (todayItems.length > 0) {
          throw new DuplicateRecommendationError(todayItems[0]);
        }
      }

      const gymId = useGymStore.getState().activeGymId;
      const memberId = useGymStore.getState().activeMemberId;
      const scopedInput =
        gymId && !isAllGymsId(gymId)
          ? {
              ...input,
              gymId,
              ...(memberId ? { memberId } : {}),
            }
          : input;
      const res = await recommendationApi.create(scopedInput);
      return res.data.data;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
      navigate(
        `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', result.machineCode)}?id=${result.id}`,
        { state: { result }, replace: true }
      );
    },
    onError: (error: unknown) => {
      if (error instanceof DuplicateRecommendationError) {
        const isFreeWeight = isFreeWeightMachineCode(error.historyItem.machineCode);
        showToast(
          t(
            isFreeWeight
              ? 'machines:recommendation.duplicate'
              : 'machines:recommendation.duplicateMachine'
          ),
          'info'
        );
        navigate(buildRecordsHistoryFocusUrl(error.historyItem), { replace: true });
        return;
      }
      if (error instanceof Error && error.message === 'missing_gender') {
        showToast(t('common:auth.genderRequiredForRecommend'), 'error');
        navigate(ROUTES.SETTINGS, {
          state: {
            returnTo: machineCode
              ? ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode)
              : undefined,
          },
        });
        return;
      }
      if (error instanceof Error && error.message === 'missing_profile') {
        showToast(t('common:auth.profileRequiredForRecommend'), 'error');
        navigate(ROUTES.SETTINGS, {
          state: {
            returnTo: machineCode
              ? ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode)
              : undefined,
          },
        });
        return;
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  return {
    requestRecommendation: (options?: RecommendMachineOptions) => mutation.mutate(options ?? {}),
    isPending: mutation.isPending,
    isError: mutation.isError,
    reset: mutation.reset,
  };
}
