import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ExperienceLevel,
  Gender,
  GymMember,
  RecommendationInput,
  TargetMuscleGroup,
} from '@machinefit/shared';
import { ageFromBirthDate, isFreeWeightMachineCode } from '@machinefit/shared';
import { gymMemberApi, historyApi, recommendationApi } from '@/api';
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

function isUsableBodyMetric(heightCm?: number, weightKg?: number): boolean {
  if (heightCm == null || heightCm < 100 || heightCm > 250) return false;
  if (weightKg == null || weightKg < 30 || weightKg > 300) return false;
  return true;
}

async function resolveActiveMember(
  queryClient: ReturnType<typeof useQueryClient>,
  gymId: string,
  memberId: string | null
): Promise<GymMember | null> {
  if (!memberId) return null;
  const cached = queryClient.getQueryData<GymMember[]>(QUERY_KEYS.userGymMembers(gymId));
  const fromCache = cached?.find((member) => member.id === memberId);
  if (fromCache) return fromCache;

  const res = await gymMemberApi.list(gymId);
  const members = res.data.data ?? [];
  queryClient.setQueryData(QUERY_KEYS.userGymMembers(gymId), members);
  return members.find((member) => member.id === memberId) ?? null;
}

function buildOwnerProfileInput(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup
): RecommendationInput | null {
  const user = useAuthStore.getState().user;
  const { unitHeight, unitWeight, weightDifficulty } = useSettingsStore.getState();

  if (!isUsableBodyMetric(user?.heightCm, user?.weightKg) || !user?.gender) {
    return null;
  }

  const gender: Gender = user.gender;
  const experienceLevel: ExperienceLevel = user.experienceLevel ?? 'intermediate';

  return {
    machineCode,
    gender,
    heightCm: user.heightCm!,
    weightKg: user.weightKg!,
    experienceLevel,
    unitHeight,
    unitWeight,
    weightDifficulty,
    ...(user.age != null ? { age: user.age } : {}),
    ...(user.workoutGoal ? { workoutGoal: user.workoutGoal } : {}),
    ...(targetMuscleGroup ? { targetMuscleGroup } : {}),
  };
}

function buildMemberProfileInput(
  machineCode: string,
  member: GymMember,
  gymId: string,
  targetMuscleGroup?: TargetMuscleGroup
): RecommendationInput | null {
  const { unitHeight, unitWeight, weightDifficulty } = useSettingsStore.getState();

  if (!member.gender || !isUsableBodyMetric(member.heightCm, member.weightKg)) {
    return null;
  }

  const age = ageFromBirthDate(member.birthDate);

  return {
    machineCode,
    gender: member.gender,
    heightCm: member.heightCm!,
    weightKg: member.weightKg!,
    // Members do not store experience/goal — do not inherit from account owner.
    experienceLevel: 'intermediate',
    unitHeight,
    unitWeight,
    weightDifficulty,
    gymId,
    memberId: member.id,
    ...(age != null ? { age } : {}),
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

      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      const gymId = useGymStore.getState().activeGymId;
      const memberId = useGymStore.getState().activeMemberId;

      let input: RecommendationInput | null = null;

      if (isAuthenticated) {
        if (!gymId) throw new Error('missing_gym');
        if (!memberId) throw new Error('missing_member');

        const member = await resolveActiveMember(queryClient, gymId, memberId);
        if (!member) throw new Error('missing_member');

        if (member.isSelf) {
          input = buildOwnerProfileInput(machineCode, options?.targetMuscleGroup);
          if (!input) {
            const user = useAuthStore.getState().user;
            if (!user?.gender) throw new Error('missing_gender');
            throw new Error('missing_profile');
          }
          input = { ...input, gymId, memberId: member.id };
        } else {
          input = buildMemberProfileInput(
            machineCode,
            member,
            gymId,
            options?.targetMuscleGroup
          );
          if (!input) {
            if (!member.gender) throw new Error('missing_member_gender');
            throw new Error('missing_member_profile');
          }
        }

        const today = getTodayDateKey();
        const { from, to } = getLocalDayRange(today);
        const historyRes = await historyApi.list(gymId, {
          machineCode,
          limit: 20,
          from,
          to,
          memberId: member.id,
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
      } else {
        input = buildOwnerProfileInput(machineCode, options?.targetMuscleGroup);
        if (!input) {
          const user = useAuthStore.getState().user;
          if (!user?.gender) throw new Error('missing_gender');
          throw new Error('missing_profile');
        }
      }

      const res = await recommendationApi.create(input);
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
      const apiCode = (error as { response?: { data?: { code?: string } } })?.response?.data
        ?.code;
      if (apiCode === 'MEMBER_PROFILE_INCOMPLETE') {
        showToast(t('common:auth.memberProfileRequiredForRecommend'), 'error');
        navigate(ROUTES.MY_GYMS);
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
      if (
        error instanceof Error &&
        (error.message === 'missing_member_gender' || error.message === 'missing_member_profile')
      ) {
        showToast(
          error.message === 'missing_member_gender'
            ? t('common:auth.memberGenderRequiredForRecommend')
            : t('common:auth.memberProfileRequiredForRecommend'),
          'error'
        );
        navigate(ROUTES.MY_GYMS);
        return;
      }
      if (error instanceof Error && error.message === 'missing_member') {
        showToast(t('common:auth.memberRequiredForRecommend'), 'error');
        navigate(ROUTES.MY_GYMS);
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
