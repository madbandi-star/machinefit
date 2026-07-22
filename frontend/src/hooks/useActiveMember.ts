import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId } from '@machinefit/shared';
import {
  gymMemberApi,
  type CreateGymMemberInput,
  type UpdateGymMemberInput,
} from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useUIStore } from '@/store/ui.store';
import { usePremiumStore } from '@/store/premium.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { sortMembersByRegistrationOrder } from '@/utils/gymMemberDefault';

function invalidateMemberScopedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  void queryClient.invalidateQueries({ queryKey: ['favorites'] });
  void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
  void queryClient.invalidateQueries({ queryKey: ['user', 'growth-timeline'] });
  void queryClient.invalidateQueries({ queryKey: ['user', 'lifter-dna'] });
  void queryClient.invalidateQueries({ queryKey: ['user', 'achievements'] });
  void queryClient.invalidateQueries({ queryKey: ['user', 'lifted-weight'] });
  void queryClient.invalidateQueries({ queryKey: ['machine-preferences'] });
  void queryClient.invalidateQueries({ queryKey: ['recommendation-feedback'] });
}

function isPlanLimitError(error: unknown): boolean {
  const err = error as { response?: { status?: number; data?: { code?: string } } };
  return (
    err?.response?.status === 402 ||
    err?.response?.data?.code === 'PLAN_LIMIT'
  );
}

export function useActiveMember() {
  const { t } = useTranslation(['gyms', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const openPremiumModal = usePremiumStore((s) => s.openPremiumModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Match gym picker resolution (not raw persisted store alone).
  const { activeGymId } = useActiveGym();
  const activeMemberId = useGymStore((s) => s.activeMemberId);
  const setActiveMemberId = useGymStore((s) => s.setActiveMemberId);

  const isRealGym = Boolean(activeGymId) && !isAllGymsId(activeGymId);
  const membersKey = QUERY_KEYS.userGymMembers(activeGymId ?? '');

  const { data: membersRaw = [], isLoading, isFetched } = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const res = await gymMemberApi.list(activeGymId!);
      return res.data.data ?? [];
    },
    enabled: isAuthenticated && isRealGym,
    staleTime: 30_000,
  });

  const members = useMemo(
    () => sortMembersByRegistrationOrder(membersRaw),
    [membersRaw]
  );

  const defaultMember = members[0] ?? null;
  const storedMemberValid =
    Boolean(activeMemberId) && members.some((member) => member.id === activeMemberId);
  const resolvedMemberId = storedMemberValid
    ? activeMemberId
    : (defaultMember?.id ?? null);
  const activeMember =
    members.find((member) => member.id === resolvedMemberId) ?? defaultMember ?? null;

  useEffect(() => {
    if (!isRealGym || !isFetched) return;
    if (!resolvedMemberId) return;
    if (activeMemberId === resolvedMemberId) return;
    setActiveMemberId(resolvedMemberId);
  }, [activeMemberId, isFetched, isRealGym, resolvedMemberId, setActiveMemberId]);

  const createMutation = useMutation({
    mutationFn: (input: CreateGymMemberInput) => gymMemberApi.create(activeGymId!, input),
    onSuccess: async (res) => {
      const member = res.data.data;
      setActiveMemberId(member.id);
      invalidateMemberScopedQueries(queryClient);
      await queryClient.invalidateQueries({ queryKey: membersKey });
      showToast(t('gyms:members.createSuccess'), 'success');
    },
    onError: (error) => {
      if (isPlanLimitError(error)) {
        openPremiumModal();
      } else {
        showToast(t('common:errors.submitFailed'), 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      memberId,
      body,
    }: {
      memberId: string;
      body: UpdateGymMemberInput;
    }) => gymMemberApi.update(activeGymId!, memberId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: membersKey });
      showToast(t('gyms:manage.updateMemberSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => gymMemberApi.remove(activeGymId!, memberId),
    onSuccess: async (_res, removedId) => {
      if (activeMemberId === removedId) {
        setActiveMemberId(null);
      }
      await queryClient.invalidateQueries({ queryKey: membersKey });
      showToast(t('gyms:members.removeSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const selectMember = useCallback(
    (memberId: string | null) => {
      setActiveMemberId(memberId);
      invalidateMemberScopedQueries(queryClient);
    },
    [queryClient, setActiveMemberId]
  );

  const createMember = useCallback(
    async (input: CreateGymMemberInput) => {
      if (!isRealGym) return;
      return createMutation.mutateAsync(input);
    },
    [createMutation, isRealGym]
  );

  const updateMember = useCallback(
    async (memberId: string, body: UpdateGymMemberInput) => {
      if (!isRealGym) return;
      return updateMutation.mutateAsync({ memberId, body });
    },
    [isRealGym, updateMutation]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!isRealGym) return;
      return removeMutation.mutateAsync(memberId);
    },
    [isRealGym, removeMutation]
  );

  return {
    members,
    activeMember,
    activeMemberId: activeMember?.id ?? resolvedMemberId,
    isLoading,
    isRealGym,
    /** Ready to fetch member-scoped favorites / records data. */
    memberScopeReady: !isRealGym || Boolean(resolvedMemberId),
    selectMember,
    createMember,
    updateMember,
    removeMember,
  };
}
