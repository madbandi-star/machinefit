import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ExperienceLevel,
  Gender,
  GymMember,
  RecommendationInput,
  TargetMuscleGroup,
  UserGym,
} from '@machinefit/shared';
import { ageFromBirthDate, isAllGymsId, isFreeWeightMachineCode } from '@machinefit/shared';
import { gymMemberApi, historyApi, recommendationApi, userGymApi, type UserGymsResponse } from '@/api';
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
import { getApiErrorCode } from '@/utils/motivationAudio';
import { sortMembersByRegistrationOrder } from '@/utils/gymMemberDefault';

function isUsableBodyMetric(heightCm?: number, weightKg?: number): boolean {
  if (heightCm == null || heightCm < 100 || heightCm > 250) return false;
  if (weightKg == null || weightKg < 30 || weightKg > 300) return false;
  return true;
}

async function loadUserGyms(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<UserGymsResponse> {
  const cached = queryClient.getQueryData<UserGymsResponse>(QUERY_KEYS.userGyms);
  if (cached?.items) return cached;
  const res = await userGymApi.list();
  const data = res.data.data;
  queryClient.setQueryData(QUERY_KEYS.userGyms, data);
  return data;
}

function pickResolvedGymId(
  gyms: UserGym[],
  storedGymId: string | null,
  serverActiveGymId: string | null | undefined
): string | null {
  if (storedGymId && !isAllGymsId(storedGymId) && gyms.some((gym) => gym.id === storedGymId)) {
    return storedGymId;
  }
  if (
    serverActiveGymId &&
    !isAllGymsId(serverActiveGymId) &&
    gyms.some((gym) => gym.id === serverActiveGymId)
  ) {
    return serverActiveGymId;
  }
  return gyms[0]?.id ?? null;
}

async function loadMembers(
  queryClient: ReturnType<typeof useQueryClient>,
  gymId: string
): Promise<GymMember[]> {
  const cached = queryClient.getQueryData<GymMember[]>(QUERY_KEYS.userGymMembers(gymId));
  if (cached) return cached;
  const res = await gymMemberApi.list(gymId);
  const members = sortMembersByRegistrationOrder(res.data.data ?? []);
  queryClient.setQueryData(QUERY_KEYS.userGymMembers(gymId), members);
  return members;
}

/**
 * Resolve a real gym + member when available (even if Search/detail never
 * mounted useActiveGym/useActiveMember). Returns null when the user has no
 * gym/member yet — recommend still works from the account body profile.
 */
async function resolveGymAndMember(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<{ gymId: string; member: GymMember } | null> {
  try {
    const store = useGymStore.getState();
    const gymsData = await loadUserGyms(queryClient);
    const gyms = gymsData.items ?? [];
    const gymId = pickResolvedGymId(gyms, store.activeGymId, gymsData.activeGymId);
    if (!gymId) return null;

    const members = await loadMembers(queryClient, gymId);
    if (members.length === 0) return null;

    const storedMemberId = store.activeMemberId;
    const member =
      (storedMemberId ? members.find((item) => item.id === storedMemberId) : undefined) ??
      members.find((item) => item.isSelf) ??
      members[0]!;

    if (store.activeGymId !== gymId) store.setActiveGymId(gymId);
    if (store.activeMemberId !== member.id) store.setActiveMemberId(member.id);

    return { gymId, member };
  } catch {
    return null;
  }
}

function requireOwnerProfileInput(
  machineCode: string,
  targetMuscleGroup?: TargetMuscleGroup
): RecommendationInput {
  const input = buildOwnerProfileInput(machineCode, targetMuscleGroup);
  if (input) return input;
  const user = useAuthStore.getState().user;
  if (!user?.gender) throw new Error('missing_gender');
  throw new Error('missing_profile');
}

async function assertNoDuplicateToday(params: {
  gymId: string;
  memberId: string;
  machineCode: string;
  targetMuscleGroup?: TargetMuscleGroup;
}): Promise<void> {
  try {
    const today = getTodayDateKey();
    const { from, to } = getLocalDayRange(today);
    const historyRes = await historyApi.list(params.gymId, {
      machineCode: params.machineCode,
      limit: 20,
      from,
      to,
      memberId: params.memberId,
    });
    const todayItems = historyRes.data.data;
    const requestedMuscle = params.targetMuscleGroup;

    if (isFreeWeightMachineCode(params.machineCode)) {
      if (requestedMuscle) {
        const sameMuscleToday = todayItems.find(
          (item) => item.targetMuscleGroup === requestedMuscle
        );
        if (sameMuscleToday) {
          throw new DuplicateRecommendationError(sameMuscleToday);
        }
      }
      return;
    }

    if (todayItems.length > 0) {
      throw new DuplicateRecommendationError(todayItems[0]);
    }
  } catch (error) {
    if (error instanceof DuplicateRecommendationError) throw error;
    // History lookup is best-effort — never block recommend for gym/network issues.
  }
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
      let input: RecommendationInput | null = null;

      if (isAuthenticated) {
        const scope = await resolveGymAndMember(queryClient);

        if (!scope) {
          // No gym registered yet — recommend from account profile (backend legacy path).
          input = requireOwnerProfileInput(machineCode, options?.targetMuscleGroup);
        } else if (scope.member.isSelf) {
          input = {
            ...requireOwnerProfileInput(machineCode, options?.targetMuscleGroup),
            gymId: scope.gymId,
            memberId: scope.member.id,
          };
          await assertNoDuplicateToday({
            gymId: scope.gymId,
            memberId: scope.member.id,
            machineCode,
            targetMuscleGroup: options?.targetMuscleGroup,
          });
        } else {
          input = buildMemberProfileInput(
            machineCode,
            scope.member,
            scope.gymId,
            options?.targetMuscleGroup
          );
          if (!input) {
            if (!scope.member.gender) throw new Error('missing_member_gender');
            throw new Error('missing_member_profile');
          }
          await assertNoDuplicateToday({
            gymId: scope.gymId,
            memberId: scope.member.id,
            machineCode,
            targetMuscleGroup: options?.targetMuscleGroup,
          });
        }
      } else {
        input = requireOwnerProfileInput(machineCode, options?.targetMuscleGroup);
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

      const apiCode = getApiErrorCode(error);
      if (apiCode === 'MEMBER_PROFILE_INCOMPLETE') {
        showToast(t('common:auth.memberProfileRequiredForRecommend'), 'error');
        navigate(ROUTES.MY_GYMS);
        return;
      }
      if (apiCode === 'INTERNAL_ERROR') {
        showToast(t('common:errors.serverError'), 'error');
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
      if (apiCode === 'VALIDATION_ERROR') {
        showToast(t('common:errors.validationError'), 'error');
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
