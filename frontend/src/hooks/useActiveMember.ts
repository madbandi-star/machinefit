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
  const activeGymId = useGymStore((s) => s.activeGymId);
  const activeMemberId = useGymStore((s) => s.activeMemberId);
  const setActiveMemberId = useGymStore((s) => s.setActiveMemberId);

  const isRealGym = Boolean(activeGymId) && !isAllGymsId(activeGymId);
  const membersKey = QUERY_KEYS.userGymMembers(activeGymId ?? '');

  const { data: membersRaw = [], isLoading } = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const res = await gymMemberApi.list(activeGymId!);
      return res.data.data;
    },
    enabled: isAuthenticated && isRealGym,
    staleTime: 30_000,
  });

  // Registration order: earliest created first
  const members = useMemo(
    () =>
      [...membersRaw].sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt)
      ),
    [membersRaw]
  );

  const defaultMember = members[0] ?? null;
  const storedMemberValid =
    Boolean(activeMemberId) && members.some((member) => member.id === activeMemberId);
  const resolvedMemberId = storedMemberValid
    ? activeMemberId
    : (defaultMember?.id ?? null);
  const activeMember = members.find((member) => member.id === resolvedMemberId) ?? null;

  // Persist default (first registered) when none selected or selection is invalid for this gym
  useEffect(() => {
    if (!isRealGym || !resolvedMemberId) return;
    if (activeMemberId === resolvedMemberId) return;
    setActiveMemberId(resolvedMemberId);
  }, [activeMemberId, isRealGym, resolvedMemberId, setActiveMemberId]);

  const createMutation = useMutation({
    mutationFn: (input: CreateGymMemberInput) => gymMemberApi.create(activeGymId!, input),
    onSuccess: async (res) => {
      const member = res.data.data;
      setActiveMemberId(member.id);
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
    },
    [setActiveMemberId]
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
    activeMemberId: resolvedMemberId,
    isLoading,
    isRealGym,
    selectMember,
    createMember,
    updateMember,
    removeMember,
  };
}
