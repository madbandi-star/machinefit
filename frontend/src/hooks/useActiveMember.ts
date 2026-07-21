import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId } from '@machinefit/shared';
import { gymMemberApi, type CreateGymMemberInput } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useGymStore } from '@/store/gym.store';
import { useUIStore } from '@/store/ui.store';
import { usePremiumStore } from '@/store/premium.store';
import { invalidateGymScopedQueries } from '@/utils/invalidateGymScopedQueries';

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

  const { data: members = [], isLoading } = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const res = await gymMemberApi.list(activeGymId!);
      return res.data.data;
    },
    enabled: isAuthenticated && isRealGym,
    staleTime: 30_000,
  });

  const selfMember = members.find((m) => m.isSelf);
  const resolvedMemberId = activeMemberId ?? selfMember?.id ?? null;
  const activeMember = members.find((m) => m.id === resolvedMemberId) ?? null;
  const syncedSelfRef = useRef<string | null>(null);

  // Persist auto-resolved self member so query keys and write paths stay stable
  useEffect(() => {
    if (!isRealGym || !selfMember) {
      syncedSelfRef.current = null;
      return;
    }
    if (activeMemberId && members.some((m) => m.id === activeMemberId)) {
      syncedSelfRef.current = activeMemberId;
      return;
    }
    if (syncedSelfRef.current === selfMember.id && activeMemberId === selfMember.id) return;
    syncedSelfRef.current = selfMember.id;
    setActiveMemberId(selfMember.id);
  }, [activeMemberId, isRealGym, members, selfMember, setActiveMemberId]);

  const createMutation = useMutation({
    mutationFn: (input: CreateGymMemberInput) => gymMemberApi.create(activeGymId!, input),
    onSuccess: async (res) => {
      const member = res.data.data;
      setActiveMemberId(member.id);
      await queryClient.invalidateQueries({ queryKey: membersKey });
      invalidateGymScopedQueries(queryClient);
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

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => gymMemberApi.remove(activeGymId!, memberId),
    onSuccess: async (_res, removedId) => {
      if (activeMemberId === removedId) {
        setActiveMemberId(null);
      }
      await queryClient.invalidateQueries({ queryKey: membersKey });
      invalidateGymScopedQueries(queryClient);
      showToast(t('gyms:members.removeSuccess'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const selectMember = useCallback(
    (memberId: string | null) => {
      if (memberId === activeMemberId) return;
      setActiveMemberId(memberId);
      invalidateGymScopedQueries(queryClient);
    },
    [activeMemberId, queryClient, setActiveMemberId]
  );

  const createMember = useCallback(
    async (input: CreateGymMemberInput) => {
      if (!isRealGym) return;
      return createMutation.mutateAsync(input);
    },
    [createMutation, isRealGym]
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
    /** Ready to fetch member-scoped home/records data. */
    memberScopeReady: !isRealGym || Boolean(resolvedMemberId),
    selectMember,
    createMember,
    removeMember,
  };
}
